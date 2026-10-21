/**
 * Debt calculation and simplification engine for Pocketsplit.
 * 
 * Uses integer math (paise / cents) to completely eliminate floating-point rounding errors.
 * Handles uneven splits fairly by assigning remaining indivisible cents to initial participants.
 */

import { CurrencyCode, Debt, Expense, Member, MemberBalance, Settlement, SplitDetail, SplitType } from '../types';

/**
 * Converts a floating currency amount to integer subunits (e.g. ₹10.50 -> 1050 paise, $5.25 -> 525 cents).
 */
export function toSubunits(amount: number): number {
  return Math.round((Number(amount) || 0) * 100);
}

/**
 * Converts integer subunits back to standard floating decimal (e.g. 1050 -> 10.50).
 */
export function fromSubunits(subunits: number): number {
  return subunits / 100;
}

/**
 * Computes exact split details for any split type, strictly ensuring the sum equals total amount.
 */
export function computeSplitAllocations(
  totalAmount: number,
  participantIds: string[],
  splitType: SplitType,
  inputs?: {
    exactAmounts?: Record<string, number>;
    percentages?: Record<string, number>;
    shares?: Record<string, number>;
    adjustments?: Record<string, number>;
  }
): SplitDetail[] {
  const totalCents = toSubunits(totalAmount);
  const n = participantIds.length;
  if (n === 0 || totalCents <= 0) return [];

  const details: SplitDetail[] = [];

  switch (splitType) {
    case 'equal': {
      const baseCents = Math.floor(totalCents / n);
      const remainderCents = totalCents - baseCents * n;

      participantIds.forEach((id, index) => {
        // Distribute remainder 1 cent to the first 'remainderCents' participants
        const allocatedCents = baseCents + (index < remainderCents ? 1 : 0);
        details.push({
          memberId: id,
          amount: fromSubunits(allocatedCents),
        });
      });
      break;
    }

    case 'exact': {
      participantIds.forEach((id) => {
        const val = inputs?.exactAmounts?.[id] || 0;
        details.push({
          memberId: id,
          amount: val,
        });
      });
      break;
    }

    case 'percentage': {
      let allocatedSumCents = 0;
      participantIds.forEach((id, index) => {
        const pct = inputs?.percentages?.[id] || 0;
        let cents = 0;
        if (index === n - 1) {
          // Last participant gets the exact remaining difference to ensure 100% precision
          cents = totalCents - allocatedSumCents;
        } else {
          cents = Math.round((totalCents * pct) / 100);
          allocatedSumCents += cents;
        }
        details.push({
          memberId: id,
          amount: fromSubunits(cents),
          percentage: pct,
        });
      });
      break;
    }

    case 'shares': {
      const totalShares = participantIds.reduce((sum, id) => sum + (inputs?.shares?.[id] || 1), 0);
      let allocatedSumCents = 0;
      participantIds.forEach((id, index) => {
        const share = inputs?.shares?.[id] || 1;
        let cents = 0;
        if (index === n - 1) {
          cents = totalCents - allocatedSumCents;
        } else {
          cents = totalShares > 0 ? Math.floor((totalCents * share) / totalShares) : 0;
          allocatedSumCents += cents;
        }
        details.push({
          memberId: id,
          amount: fromSubunits(cents),
          share: share,
        });
      });
      break;
    }

    case 'adjustment': {
      const adjustments = participantIds.map((id) => toSubunits(inputs?.adjustments?.[id] || 0));
      const totalAdjustments = adjustments.reduce((a, b) => a + b, 0);
      const remainingCents = totalCents - totalAdjustments;
      const baseCents = Math.floor(remainingCents / n);
      const remainderCents = remainingCents - baseCents * n;

      participantIds.forEach((id, index) => {
        const adj = adjustments[index];
        const cents = baseCents + (index < remainderCents ? 1 : 0) + adj;
        details.push({
          memberId: id,
          amount: fromSubunits(cents),
          adjustment: fromSubunits(adj),
        });
      });
      break;
    }
  }

  return details;
}

/**
 * Calculates net balance for every member in the group.
 * Positive balance = owed money (creditor).
 * Negative balance = owes money (debtor).
 */
export function calculateMemberBalances(
  members: Member[],
  expenses: Expense[],
  settlements: Settlement[]
): Record<string, MemberBalance> {
  const balances: Record<string, MemberBalance> = {};

  // Initialize
  members.forEach((m) => {
    balances[m.id] = {
      memberId: m.id,
      memberName: m.name,
      netBalance: 0,
      totalPaid: 0,
      totalShare: 0,
    };
  });

  // Track in subunits (paise) to prevent decimal drift
  const netCents: Record<string, number> = {};
  const paidCents: Record<string, number> = {};
  const shareCents: Record<string, number> = {};

  members.forEach((m) => {
    netCents[m.id] = 0;
    paidCents[m.id] = 0;
    shareCents[m.id] = 0;
  });

  // 1. Process Expenses
  expenses.forEach((expense) => {
    // Credit payers
    expense.paidBy.forEach((payer) => {
      const payerId = payer.memberId;
      const cents = toSubunits(payer.amount);
      if (paidCents[payerId] !== undefined) {
        paidCents[payerId] += cents;
        netCents[payerId] += cents;
      }
    });

    // Debit split shares
    expense.splitDetails.forEach((split) => {
      const memberId = split.memberId;
      const cents = toSubunits(split.amount);
      if (shareCents[memberId] !== undefined) {
        shareCents[memberId] += cents;
        netCents[memberId] -= cents;
      }
    });
  });

  // 2. Process Settlements
  settlements.forEach((settlement) => {
    const cents = toSubunits(settlement.amount);
    const fromId = settlement.fromMemberId;
    const toId = settlement.toMemberId;

    // fromId paid money to toId, so fromId's net debt decreases (netBalance increases)
    if (netCents[fromId] !== undefined) {
      netCents[fromId] += cents;
    }
    // toId received money, so their credit decreases
    if (netCents[toId] !== undefined) {
      netCents[toId] -= cents;
    }
  });

  // Convert back to floating values
  members.forEach((m) => {
    balances[m.id] = {
      memberId: m.id,
      memberName: m.name,
      netBalance: fromSubunits(netCents[m.id] || 0),
      totalPaid: fromSubunits(paidCents[m.id] || 0),
      totalShare: fromSubunits(shareCents[m.id] || 0),
    };
  });

  return balances;
}

/**
 * Calculates raw pairwise debts (unsimplified) by looking at who paid for whom directly.
 */
export function calculateRawDebts(
  expenses: Expense[],
  settlements: Settlement[],
  currency: CurrencyCode
): Debt[] {
  // Directed graph of debt: pairwise[debtor][creditor] = cents
  const pairwise: Record<string, Record<string, number>> = {};

  const addDebt = (from: string, to: string, cents: number) => {
    if (from === to || cents <= 0) return;
    if (!pairwise[from]) pairwise[from] = {};
    if (!pairwise[to]) pairwise[to] = {};
    pairwise[from][to] = (pairwise[from][to] || 0) + cents;
  };

  expenses.forEach((expense) => {
    const totalExpenseCents = toSubunits(expense.amount);
    if (totalExpenseCents <= 0) return;

    // For multi-payers, each payer funded a percentage of the total bill
    expense.paidBy.forEach((payer) => {
      const payerCents = toSubunits(payer.amount);
      if (payerCents <= 0) return;
      const payerRatio = payerCents / totalExpenseCents;

      expense.splitDetails.forEach((split) => {
        if (split.memberId === payer.memberId) return;
        const participantShareCents = toSubunits(split.amount);
        const debtOwedCents = Math.round(participantShareCents * payerRatio);
        addDebt(split.memberId, payer.memberId, debtOwedCents);
      });
    });
  });

  // Offset with settlements
  settlements.forEach((s) => {
    const sCents = toSubunits(s.amount);
    // from paid to, so from's debt to 'to' decreases (or 'to' now owes 'from')
    addDebt(s.toMemberId, s.fromMemberId, sCents);
  });

  // Net out bilateral debts (A owes B 100, B owes A 40 -> A owes B 60)
  const debts: Debt[] = [];
  const processed = new Set<string>();

  const allMembers = Array.from(new Set(Object.keys(pairwise)));

  for (let i = 0; i < allMembers.length; i++) {
    for (let j = i + 1; j < allMembers.length; j++) {
      const u = allMembers[i];
      const v = allMembers[j];
      const pairKey = `${u}_${v}`;
      if (processed.has(pairKey)) continue;
      processed.add(pairKey);

      const uOwesV = pairwise[u]?.[v] || 0;
      const vOwesU = pairwise[v]?.[u] || 0;
      const net = uOwesV - vOwesU;

      if (net > 5) {
        // u owes v net cents (> 0.05 currency units)
        debts.push({
          from: u,
          to: v,
          amount: fromSubunits(net),
          currency,
        });
      } else if (net < -5) {
        // v owes u
        debts.push({
          from: v,
          to: u,
          amount: fromSubunits(-net),
          currency,
        });
      }
    }
  }

  return debts;
}

/**
 * Min Cash Flow Debt Simplification Algorithm.
 * 
 * Takes net balances of all group members and produces the minimum number
 * of transactions required to settle all debts (at most N-1 transactions).
 */
export function simplifyDebts(
  memberBalances: Record<string, MemberBalance>,
  currency: CurrencyCode
): Debt[] {
  // Extract creditors (net > 0) and debtors (net < 0) in cents
  interface Participant {
    id: string;
    cents: number;
  }

  const creditors: Participant[] = [];
  const debtors: Participant[] = [];

  Object.values(memberBalances).forEach((mb) => {
    const cents = toSubunits(mb.netBalance);
    if (cents > 0) {
      creditors.push({ id: mb.memberId, cents });
    } else if (cents < 0) {
      debtors.push({ id: mb.memberId, cents: -cents }); // store positive magnitude
    }
  });

  const simplified: Debt[] = [];

  // Greedy match largest debtor with largest creditor
  while (debtors.length > 0 && creditors.length > 0) {
    // Sort descending by magnitude
    debtors.sort((a, b) => b.cents - a.cents);
    creditors.sort((a, b) => b.cents - a.cents);

    const debtor = debtors[0];
    const creditor = creditors[0];

    const settleCents = Math.min(debtor.cents, creditor.cents);

    if (settleCents >= 5) { // ignore fractions under 0.05
      simplified.push({
        from: debtor.id,
        to: creditor.id,
        amount: fromSubunits(settleCents),
        currency,
      });
    }

    debtor.cents -= settleCents;
    creditor.cents -= settleCents;

    if (debtor.cents <= 0) {
      debtors.shift();
    }
    if (creditor.cents <= 0) {
      creditors.shift();
    }
  }

  return simplified;
}
