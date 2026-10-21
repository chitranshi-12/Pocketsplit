import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGroups } from '../../context/GroupContext';
import { CURRENCIES, Debt } from '../../types';
import { Avatar } from '../common/Avatar';
import { 
  ArrowDownLeft, 
  ArrowRight, 
  ArrowUpRight, 
  Check, 
  CreditCard, 
  Plus, 
  QrCode, 
  Receipt, 
  Sparkles, 
  TrendingUp, 
  Users 
} from 'lucide-react';

interface DashboardViewProps {
  onOpenAddExpense: () => void;
  onOpenSettleUp: (debt?: Debt) => void;
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAddExpense,
  onOpenSettleUp,
  onSelectGroup,
  onCreateGroup,
}) => {
  const { user } = useAuth();
  const {
    groups,
    activeGroup,
    totalYouOwe,
    totalYouAreOwed,
    netGlobalBalance,
    debts,
    expenses,
    memberBalances,
    toggleSimplifyDebts,
  } = useGroups();

  const currencySymbol = CURRENCIES[user?.currency || 'INR']?.symbol || '₹';

  // Member lookup map
  const memberMap = new Map<string, string>();
  activeGroup?.members.forEach((m) => memberMap.set(m.id, m.name));

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time balance breakdown, active debts, and payment settlements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onOpenSettleUp()}
            className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-100 transition-colors shadow-xs"
          >
            <CreditCard className="w-4 h-4" />
            <span>Settle Up</span>
          </button>

          <button
            onClick={onOpenAddExpense}
            className="flex items-center gap-2 py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md shadow-emerald-600/30 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Add Expense</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Net Balance Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Net Balance
            </span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-extrabold ${
                netGlobalBalance > 0
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : netGlobalBalance < 0
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {netGlobalBalance > 0 ? 'You Get Back' : netGlobalBalance < 0 ? 'You Owe' : 'All Settled'}
            </span>
          </div>

          <div
            className={`text-3xl sm:text-4xl font-black tracking-tight ${
              netGlobalBalance > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : netGlobalBalance < 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            {netGlobalBalance >= 0 ? '+' : '-'}
            {currencySymbol} {Math.abs(netGlobalBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            {netGlobalBalance > 0
              ? 'Overall across all groups, friends owe you'
              : netGlobalBalance < 0
              ? 'Overall across all groups, you need to pay'
              : 'You are completely settled up!'}
          </p>
        </div>

        {/* You Are Owed */}
        <div className="p-6 rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 shadow-sm">
          <div className="flex items-center justify-between mb-3 text-emerald-800 dark:text-emerald-300">
            <span className="text-xs font-bold uppercase tracking-wider">You are owed</span>
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            {currencySymbol} {totalYouAreOwed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/70 mt-2 font-medium">
            Friends will pay you this amount
          </p>
        </div>

        {/* You Owe */}
        <div className="p-6 rounded-3xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 shadow-sm">
          <div className="flex items-center justify-between mb-3 text-rose-800 dark:text-rose-300">
            <span className="text-xs font-bold uppercase tracking-wider">You owe</span>
            <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-rose-600 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
            {currencySymbol} {totalYouOwe.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-rose-700/80 dark:text-rose-400/70 mt-2 font-medium">
            Pending settlements you need to pay
          </p>
        </div>
      </div>

      {/* CORE SECTION: WHO HAS TO PAY WHOM (CLEAR SETTLEMENT LIST) */}
      {activeGroup && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{activeGroup.emoji || '👥'}</span>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  Who Has To Pay Whom in {activeGroup.name}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Calculated using the {activeGroup.simplifyDebts ? 'debt simplification algorithm' : 'direct pairwise ledger'}.
              </p>
            </div>

            {/* Simplify Debts Switch */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 pl-2">
                Simplify Debts
              </span>
              <button
                type="button"
                onClick={() => toggleSimplifyDebts(activeGroup.id)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  activeGroup.simplifyDebts ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    activeGroup.simplifyDebts ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {debts.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h4 className="font-black text-sm text-slate-900 dark:text-white">All Settled Up!</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Nobody owes anyone in this group. Add a new bill to split anytime!
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {debts.map((d, index) => {
                const fromName = memberMap.get(d.from) || 'Member';
                const toName = memberMap.get(d.to) || 'Member';
                const isUserDebtor = d.from === user?.id;
                const isUserCreditor = d.to === user?.id;

                return (
                  <div
                    key={index}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-emerald-400 transition-colors shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center gap-2">
                        <Avatar name={fromName} size="sm" />
                        <span className={`text-sm font-black ${isUserDebtor ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                          {isUserDebtor ? 'You' : fromName}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-slate-400 text-xs px-1">
                        <span>pays</span>
                        <ArrowRight className="w-4 h-4 text-emerald-600" />
                      </div>

                      <div className="flex items-center gap-2">
                        <Avatar name={toName} size="sm" />
                        <span className={`text-sm font-black ${isUserCreditor ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                          {isUserCreditor ? 'You' : toName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-700/60">
                      <div className="text-right">
                        <div className="text-lg font-black text-slate-900 dark:text-white">
                          {currencySymbol} {d.amount.toFixed(2)}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">Pending transfer</span>
                      </div>

                      <button
                        onClick={() => onOpenSettleUp(d)}
                        className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Settle Now</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Member Balances Mini-Table */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Member Net Positions in {activeGroup.name}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {activeGroup.members.map((m) => {
                const bal = memberBalances[m.id];
                const net = bal?.netBalance || 0;
                return (
                  <div
                    key={m.id}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar name={m.name} size="xs" />
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {m.name}
                      </span>
                    </div>

                    <div className="text-right font-black">
                      <span className={net > 0 ? 'text-emerald-600' : net < 0 ? 'text-rose-600' : 'text-slate-400'}>
                        {net >= 0 ? '+' : ''}{currencySymbol} {net.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Your Groups List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>Your Groups</span>
          </h2>
          <button
            onClick={onCreateGroup}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Create New Group</span>
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-emerald-300 dark:border-emerald-800">
            <Users className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">Create Your First Group</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-sm mx-auto">
              Groups let you split expenses for trips, flatmates, dinners, or couples with automatic balance calculation.
            </p>
            <button
              onClick={onCreateGroup}
              className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            >
              + Create Group Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {groups.map((g) => {
              const isCurrent = activeGroup?.id === g.id;
              return (
                <div
                  key={g.id}
                  onClick={() => onSelectGroup(g.id)}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'border-emerald-500 bg-white dark:bg-slate-900 ring-2 ring-emerald-500/20 shadow-md'
                      : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xl flex items-center justify-center">
                      {g.emoji || '👥'}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {g.type}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white truncate">{g.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{g.members.length} members</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Expenses Feed */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>Recent Expenses ({expenses.length})</span>
          </h3>
          <span className="text-xs text-slate-400 font-semibold">
            {activeGroup?.name || 'Group'}
          </span>
        </div>

        {expenses.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No expenses logged yet. Tap "+ Add Expense" above to add the first bill!
          </div>
        ) : (
          <div className="space-y-2.5">
            {expenses.slice(0, 5).map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {exp.category === 'Food & Drink'
                      ? '🍔'
                      : exp.category === 'Transportation'
                      ? '🚗'
                      : exp.category === 'Rent & Housing'
                      ? '🏠'
                      : exp.category === 'Groceries'
                      ? '🛒'
                      : '🧾'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 dark:text-white truncate">
                      {exp.description}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {exp.date} • {exp.paidBy.map((p) => memberMap.get(p.memberId) || 'User').join(', ')} paid
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="font-black text-sm text-slate-900 dark:text-white">
                    {currencySymbol} {exp.amount.toFixed(2)}
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                    {exp.splitType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
