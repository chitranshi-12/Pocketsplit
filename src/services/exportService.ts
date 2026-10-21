import { CURRENCIES, Debt, Expense, Group, MemberBalance } from '../types';

export function exportExpensesToCsv(group: Group, expenses: Expense[]) {
  const memberMap = new Map<string, string>();
  group.members.forEach((m) => memberMap.set(m.id, m.name));

  const headers = [
    'Date',
    'Description',
    'Category',
    'Total Amount',
    'Currency',
    'Paid By',
    'Split Type',
    'Participants',
    'Notes',
  ];

  const rows = expenses.map((exp) => {
    const paidByStr = exp.paidBy
      .map((p) => `${memberMap.get(p.memberId) || 'Unknown'} (${exp.currency} ${p.amount.toFixed(2)})`)
      .join('; ');

    const participantsStr = exp.splitDetails
      .map((s) => `${memberMap.get(s.memberId) || 'Unknown'}: ${exp.currency} ${s.amount.toFixed(2)}`)
      .join('; ');

    return [
      `"${exp.date}"`,
      `"${exp.description.replace(/"/g, '""')}"`,
      `"${exp.category}"`,
      exp.amount.toFixed(2),
      `"${exp.currency}"`,
      `"${paidByStr.replace(/"/g, '""')}"`,
      `"${exp.splitType}"`,
      `"${participantsStr.replace(/"/g, '""')}"`,
      `"${(exp.notes || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `pocketsplit-${group.name.toLowerCase().replace(/\s+/g, '-')}-expenses.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generatePrintableSummary(
  group: Group,
  expenses: Expense[],
  balances: Record<string, MemberBalance>,
  debts: Debt[]
) {
  const memberMap = new Map<string, string>();
  group.members.forEach((m) => memberMap.set(m.id, m.name));

  const totalSpending = expenses.reduce((sum, e) => sum + e.amount, 0);
  const currencySymbol = CURRENCIES[expenses[0]?.currency || 'INR']?.symbol || '₹';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${group.name} - Pocketsplit Expense Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; }
          .header { border-bottom: 2px solid #059669; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
          h1 { color: #059669; margin: 0; font-size: 24px; }
          .badge { background: #ecfdf5; color: #065f46; padding: 4px 12px; border-radius: 9999px; font-weight: 600; font-size: 14px; }
          .section { margin-bottom: 28px; }
          h2 { font-size: 16px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; font-size: 14px; }
          th { text-align: left; background: #f8fafc; padding: 10px; border-bottom: 1px solid #e2e8f0; color: #475569; }
          td { padding: 10px; border-bottom: 1px solid #f1f5f9; }
          .positive { color: #059669; font-weight: 600; }
          .negative { color: #e11d48; font-weight: 600; }
          .card-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
          .card-val { font-size: 20px; font-weight: bold; margin-top: 4px; color: #0f172a; }
          .debt-item { background: #fffbeb; border: 1px solid #fef3c7; padding: 10px 14px; border-radius: 6px; margin-bottom: 8px; font-size: 14px; }
          @media print {
            .no-print { display: none; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>${group.emoji || '👥'} ${group.name}</h1>
            <p style="color: #64748b; margin: 4px 0 0 0; font-size: 14px;">Pocketsplit Settlement & Expense Summary • Generated ${new Date().toLocaleDateString()}</p>
          </div>
          <button class="no-print" onclick="window.print()" style="background: #059669; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600;">Print / Save as PDF</button>
        </div>

        <div class="card-grid">
          <div class="card">
            <div style="font-size: 12px; color: #64748b; text-transform: uppercase;">Total Group Spending</div>
            <div class="card-val">${currencySymbol} ${totalSpending.toFixed(2)}</div>
          </div>
          <div class="card">
            <div style="font-size: 12px; color: #64748b; text-transform: uppercase;">Total Expenses Logged</div>
            <div class="card-val">${expenses.length} entries</div>
          </div>
        </div>

        <div class="section">
          <h2>Member Balances</h2>
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Total Paid</th>
                <th>Total Share</th>
                <th>Net Balance</th>
              </tr>
            </thead>
            <tbody>
              ${Object.values(balances).map((b) => `
                <tr>
                  <td><strong>${b.memberName}</strong></td>
                  <td>${currencySymbol} ${b.totalPaid.toFixed(2)}</td>
                  <td>${currencySymbol} ${b.totalShare.toFixed(2)}</td>
                  <td class="${b.netBalance >= 0 ? 'positive' : 'negative'}">
                    ${b.netBalance >= 0 ? '+' : ''}${currencySymbol} ${b.netBalance.toFixed(2)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Recommended Settlements (${group.simplifyDebts ? 'Simplified' : 'Direct'})</h2>
          ${debts.length === 0 ? '<p style="color: #059669; font-weight: 500;">All settled up! No outstanding debts.</p>' : debts.map((d) => `
            <div class="debt-item">
              <strong>${memberMap.get(d.from) || d.from}</strong> pays <strong>${memberMap.get(d.to) || d.to}</strong>: 
              <span style="font-weight: bold; color: #059669;">${currencySymbol} ${d.amount.toFixed(2)}</span>
            </div>
          `).join('')}
        </div>

        <div class="section">
          <h2>Expenses Breakdown</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Paid By</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${expenses.map((e) => `
                <tr>
                  <td>${e.date}</td>
                  <td><strong>${e.description}</strong></td>
                  <td>${e.category}</td>
                  <td>${e.paidBy.map((p) => memberMap.get(p.memberId) || 'Unknown').join(', ')}</td>
                  <td><strong>${currencySymbol} ${e.amount.toFixed(2)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
