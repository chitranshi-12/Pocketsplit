import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGroups } from '../../context/GroupContext';
import { CURRENCIES, ExpenseCategory, Member } from '../../types';
import { Avatar } from '../common/Avatar';
import { 
  BarChart3, 
  Calendar, 
  Crown, 
  Filter, 
  PieChart, 
  TrendingUp, 
  Users 
} from 'lucide-react';

export const InsightsView: React.FC = () => {
  const { user } = useAuth();
  const { groups, activeGroup, setActiveGroupId, expenses } = useGroups();
  const currencySymbol = CURRENCIES[user?.currency || 'INR']?.symbol || '₹';

  const [filterGroup, setFilterGroup] = useState<string>(activeGroup?.id || 'all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');

  // Filtered expenses based on selections
  const analyzedExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchGroup = filterGroup === 'all' || e.groupId === filterGroup;
      const matchCat = filterCategory === 'all' || e.category === filterCategory;
      const expMonth = e.date.substring(0, 7); // YYYY-MM
      const matchMon = filterMonth === 'all' || expMonth === filterMonth;
      return matchGroup && matchCat && matchMon;
    });
  }, [expenses, filterGroup, filterCategory, filterMonth]);

  const totalSpent = analyzedExpenses.reduce((sum, e) => sum + e.amount, 0);

  // 1. Spending by Category
  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    analyzedExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });

    const entries = Object.entries(map).map(([cat, total]) => ({
      category: cat,
      total,
      percentage: totalSpent > 0 ? (total / totalSpent) * 100 : 0,
    }));

    return entries.sort((a, b) => b.total - a.total);
  }, [analyzedExpenses, totalSpent]);

  // 2. Spending over time (monthly / daily timeline)
  const timelineData = useMemo(() => {
    const map: Record<string, number> = {};
    analyzedExpenses.forEach((e) => {
      // Group by date or month
      const key = e.date;
      map[key] = (map[key] || 0) + e.amount;
    });

    const sorted = Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-10); // last 10 dates

    const max = Math.max(...sorted.map((s) => s[1]), 100);
    return { list: sorted, max };
  }, [analyzedExpenses]);

  // 3. Who Paid the Most (Leaderboard)
  const memberPayTotals = useMemo(() => {
    const memberMap = new Map<string, string>();
    activeGroup?.members.forEach((m) => memberMap.set(m.id, m.name));

    const map: Record<string, number> = {};
    analyzedExpenses.forEach((e) => {
      e.paidBy.forEach((p) => {
        map[p.memberId] = (map[p.memberId] || 0) + p.amount;
      });
    });

    const list = Object.entries(map).map(([memberId, total]) => ({
      memberId,
      name: memberMap.get(memberId) || 'User',
      total,
      percentage: totalSpent > 0 ? (total / totalSpent) * 100 : 0,
    }));

    return list.sort((a, b) => b.total - a.total);
  }, [analyzedExpenses, activeGroup, totalSpent]);

  // Donut chart stroke dashes
  const CATEGORY_COLORS = [
    '#10b981', // emerald
    '#06b6d4', // cyan
    '#f59e0b', // amber
    '#6366f1', // indigo
    '#ec4899', // pink
    '#8b5cf6', // purple
    '#f43f5e', // rose
    '#64748b', // slate
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Spending Insights
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Visualize category distribution, timeline trends, and member spending leaderboards.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
          >
            <option value="all">All Groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
          >
            <option value="all">All Categories</option>
            <option value="Food & Drink">Food & Drink</option>
            <option value="Transportation">Transportation</option>
            <option value="Rent & Housing">Rent & Housing</option>
            <option value="Groceries">Groceries</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Shopping">Shopping</option>
          </select>
        </div>
      </div>

      {/* Top Stat */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-700/20">
        <span className="text-xs uppercase font-bold tracking-wider text-emerald-100">
          Filtered Group Spending Total
        </span>
        <div className="text-3xl sm:text-4xl font-extrabold mt-1">
          {currencySymbol} {totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <p className="text-xs text-emerald-100/80 mt-1">
          Across {analyzedExpenses.length} expense entries
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Category Donut Chart & Legend */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-emerald-600" />
              <span>Spending by Category</span>
            </h3>
            <span className="text-xs text-slate-400">{categoryTotals.length} categories</span>
          </div>

          {categoryTotals.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs">No expense data available</div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6 my-auto">
              {/* SVG Donut Circle */}
              <div className="relative w-44 h-44 flex-shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#e2e8f0" strokeWidth="16" />
                  {(() => {
                    let cumulative = 0;
                    const circumference = 2 * Math.PI * 38; // ~238.76
                    return categoryTotals.map((item, idx) => {
                      const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
                      const strokeDashoffset = -((cumulative / 100) * circumference);
                      cumulative += item.percentage;
                      return (
                        <circle
                          key={item.category}
                          cx="50"
                          cy="50"
                          r="38"
                          fill="transparent"
                          stroke={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                          strokeWidth="16"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-500"
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="absolute text-center">
                  <div className="text-xs text-slate-400 font-semibold uppercase">Total</div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {currencySymbol}{totalSpent >= 1000 ? `${(totalSpent / 1000).toFixed(1)}k` : totalSpent.toFixed(0)}
                  </div>
                </div>
              </div>

              {/* Legend List */}
              <div className="flex-1 space-y-2 w-full">
                {categoryTotals.slice(0, 5).map((item, idx) => (
                  <div key={item.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                      />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {item.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {currencySymbol} {item.total.toFixed(0)}
                      </span>
                      <span className="text-[11px] text-slate-400 w-10 text-right">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 2. Who Paid the Most Leaderboard */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              <span>Who Paid the Most</span>
            </h3>
            <span className="text-xs text-slate-400">Total contributors</span>
          </div>

          {memberPayTotals.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs">No payer data available</div>
          ) : (
            <div className="space-y-3.5 my-auto">
              {memberPayTotals.map((item, index) => (
                <div key={item.memberId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 text-center font-bold text-slate-400">#{index + 1}</span>
                      <Avatar name={item.name} size="xs" />
                      <span className="font-bold text-slate-900 dark:text-white">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {currencySymbol} {item.total.toFixed(2)}
                      </span>
                      <span className="text-[11px] text-slate-400">({item.percentage.toFixed(0)}%)</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Spending Timeline Chart */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <span>Spending Over Time</span>
          </h3>
          <span className="text-xs text-slate-400">Recent dates</span>
        </div>

        {timelineData.list.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">No timeline data</div>
        ) : (
          <div className="pt-4">
            <div className="flex items-end justify-between gap-2 h-44 border-b border-slate-200 dark:border-slate-800 pb-2">
              {timelineData.list.map(([d, val]) => {
                const heightPct = Math.max(10, Math.round((val / timelineData.max) * 100));
                return (
                  <div key={d} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded pointer-events-none whitespace-nowrap z-10">
                      {currencySymbol} {val.toFixed(0)}
                    </div>

                    <div className="w-full max-w-[36px] bg-emerald-500/80 hover:bg-emerald-500 rounded-t-lg transition-all" style={{ height: `${heightPct}%` }} />
                    <span className="text-[10px] text-slate-400 transform -rotate-45 origin-top-left mt-2 whitespace-nowrap">
                      {d.substring(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
