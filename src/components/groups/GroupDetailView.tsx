import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGroups } from '../../context/GroupContext';
import { CURRENCIES, Debt, Expense, ExpenseCategory, Member } from '../../types';
import { exportExpensesToCsv, generatePrintableSummary } from '../../services/exportService';
import { Avatar } from '../common/Avatar';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Calendar, 
  Check, 
  Copy, 
  CreditCard, 
  Download, 
  FileDown, 
  Filter, 
  Plus, 
  Printer, 
  Search, 
  Share2, 
  SlidersHorizontal, 
  Sparkles, 
  UserPlus, 
  Users 
} from 'lucide-react';

interface GroupDetailViewProps {
  onOpenAddExpense: () => void;
  onOpenSettleUp: (debt?: Debt) => void;
  onSelectExpense: (exp: Expense) => void;
  onCreateGroup: () => void;
}

export const GroupDetailView: React.FC<GroupDetailViewProps> = ({
  onOpenAddExpense,
  onOpenSettleUp,
  onSelectExpense,
  onCreateGroup,
}) => {
  const { user } = useAuth();
  const {
    activeGroup,
    groups,
    setActiveGroupId,
    expenses,
    memberBalances,
    debts,
    inviteMember,
  } = useGroups();

  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'debts'>('expenses');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');

  if (!activeGroup) {
    return (
      <div className="text-center py-20 px-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <Users className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-lg text-slate-900 dark:text-white">No group selected</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">Create your first group to start splitting bills</p>
        <button
          onClick={onCreateGroup}
          className="py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-semibold text-xs shadow-md"
        >
          Create Group
        </button>
      </div>
    );
  }

  const currencySymbol = CURRENCIES[user?.currency || 'INR']?.symbol || '₹';
  const members = activeGroup.members;
  const memberMap = new Map<string, Member>();
  members.forEach((m) => memberMap.set(m.id, m));

  const totalSpending = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCat = selectedCategory === 'all' || e.category === selectedCategory;

      const matchMember =
        selectedMember === 'all' ||
        e.paidBy.some((p) => p.memberId === selectedMember) ||
        e.participantIds.includes(selectedMember);

      return matchSearch && matchCat && matchMember;
    });
  }, [expenses, searchQuery, selectedCategory, selectedMember]);

  const handleCopyInviteLink = () => {
    const inviteLink = `${window.location.origin}?invite=${activeGroup.inviteCode || activeGroup.id}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      await inviteMember(activeGroup.id, inviteEmail.trim(), inviteName.trim() || undefined);
      setInviteEmail('');
      setInviteName('');
      setShowInviteModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Group Header Hero */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        {/* Top bar with Group selector dropdown and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-3xl shadow-sm flex-shrink-0">
              {activeGroup.emoji || '👥'}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white truncate">
                  {activeGroup.name}
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {activeGroup.type}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span>{members.length} members</span>
                <span>•</span>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Invite</span>
                </button>
                <span>•</span>
                <button
                  onClick={handleCopyInviteLink}
                  className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                  title="Copy shareable invite link"
                >
                  {copiedInvite ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedInvite ? 'Copied Link' : `Code: ${activeGroup.inviteCode || 'INVITE'}`}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => exportExpensesToCsv(activeGroup, expenses)}
              className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
              title="Download CSV Spreadsheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            <button
              onClick={() => generatePrintableSummary(activeGroup, expenses, memberBalances, debts)}
              className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PDF Summary</span>
            </button>

            <button
              onClick={() => onOpenSettleUp()}
              className="py-2 px-3.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Settle Up</span>
            </button>

            <button
              onClick={onOpenAddExpense}
              className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* Total Spending Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Group Spend
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {currencySymbol} {totalSpending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{expenses.length} expenses logged</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Your Share in this Group
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {currencySymbol} {(memberBalances[user?.id || '']?.totalShare || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Paid by you: {currencySymbol} {(memberBalances[user?.id || '']?.totalPaid || 0).toFixed(2)}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Your Net Group Balance
            </span>
            {(() => {
              const myBal = memberBalances[user?.id || '']?.netBalance || 0;
              return (
                <div
                  className={`text-2xl font-black mt-0.5 ${
                    myBal > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : myBal < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {myBal >= 0 ? '+' : ''}{currencySymbol} {myBal.toFixed(2)}
                </div>
              );
            })()}
            <p className="text-[11px] text-slate-400 mt-1">
              {debts.filter((d) => d.from === user?.id || d.to === user?.id).length} pending payments
            </p>
          </div>
        </div>

        {/* PROMINENT LIVE SETTLEMENTS CARD: WHO HAS TO PAY WHOM */}
        <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Who Has To Pay Whom (Active Settlements)</span>
            </h3>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {debts.length} {debts.length === 1 ? 'payment needed' : 'payments needed'}
            </span>
          </div>

          {debts.length === 0 ? (
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Everyone is completely settled up in this group! No money owed.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {debts.map((d, index) => {
                const fromName = memberMap.get(d.from)?.name || 'Member';
                const toName = memberMap.get(d.to)?.name || 'Member';
                const isYouDebtor = d.from === user?.id;
                const isYouCreditor = d.to === user?.id;

                return (
                  <div
                    key={index}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="min-w-0">
                      <div className="text-xs flex items-center gap-1.5 flex-wrap">
                        <span className={`font-black ${isYouDebtor ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                          {isYouDebtor ? 'You' : fromName}
                        </span>
                        <span className="text-slate-400 text-[11px]">has to pay</span>
                        <span className={`font-black ${isYouCreditor ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                          {isYouCreditor ? 'You' : toName}
                        </span>
                      </div>
                      <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                        {currencySymbol} {d.amount.toFixed(2)}
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenSettleUp(d)}
                      className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1 flex-shrink-0"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Settle</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tabs: Expenses / Member Balances / Debt Graph */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'expenses'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Expenses ({expenses.length})
          </button>

          <button
            onClick={() => setActiveTab('balances')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'balances'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Member Balances ({members.length})
          </button>

          <button
            onClick={() => setActiveTab('debts')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'debts'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Settlement Graph ({debts.length})
          </button>
        </div>
      </div>

      {/* TAB 1: EXPENSES LIST */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by description or category..."
                className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
              >
                <option value="all">All Categories</option>
                <option value="Food & Drink">Food & Drink 🍔</option>
                <option value="Transportation">Transportation 🚗</option>
                <option value="Rent & Housing">Rent & Housing 🏠</option>
                <option value="Groceries">Groceries 🛒</option>
                <option value="Entertainment">Entertainment 🍿</option>
                <option value="Shopping">Shopping 🛍️</option>
                <option value="Utilities">Utilities ⚡</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
              >
                <option value="all">All People</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Expenses List */}
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <p className="text-slate-500 text-xs">No matching expenses found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExpenses.map((exp) => {
                const myShareDetail = exp.splitDetails.find((s) => s.memberId === user?.id);
                const userPaidAmt = exp.paidBy.find((p) => p.memberId === user?.id)?.amount || 0;
                const payerNames = exp.paidBy.map((p) => memberMap.get(p.memberId)?.name || 'Someone').join(', ');

                return (
                  <div
                    key={exp.id}
                    onClick={() => onSelectExpense(exp)}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/40 text-emerald-600 flex items-center justify-center text-lg flex-shrink-0">
                        {exp.category === 'Food & Drink'
                          ? '🍔'
                          : exp.category === 'Transportation'
                          ? '🚗'
                          : exp.category === 'Rent & Housing'
                          ? '🏠'
                          : exp.category === 'Groceries'
                          ? '🛒'
                          : exp.category === 'Entertainment'
                          ? '🍿'
                          : '🧾'}
                      </div>

                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {exp.description}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{exp.date}</span>
                          <span>•</span>
                          <span className="truncate">
                            <span className="font-medium text-slate-700 dark:text-slate-300">{payerNames}</span> paid
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 flex-shrink-0 text-right">
                      {/* Current user's individual lent/borrowed impact */}
                      {user && (
                        <div className="hidden sm:block text-xs">
                          {userPaidAmt > 0 && (
                            <div className="text-emerald-600 font-semibold">
                              You paid {currencySymbol} {userPaidAmt.toFixed(2)}
                            </div>
                          )}
                          {myShareDetail && (
                            <div className="text-slate-400">
                              Your share: {currencySymbol} {myShareDetail.amount.toFixed(2)}
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <div className="text-base font-extrabold text-slate-900 dark:text-white">
                          {currencySymbol} {exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {exp.splitType}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MEMBER BALANCES */}
      {activeTab === 'balances' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {members.map((m) => {
            const bal = memberBalances[m.id];
            const net = bal?.netBalance || 0;
            const isMe = m.id === user?.id;

            return (
              <div
                key={m.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={m.name} size="md" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {m.name} {isMe ? '(You)' : ''}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Paid: {currencySymbol} {(bal?.totalPaid || 0).toFixed(2)} • Share: {currencySymbol} {(bal?.totalShare || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-lg font-extrabold ${
                      net > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : net < 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {net >= 0 ? '+' : ''}{currencySymbol} {net.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {net > 0 ? 'gets back' : net < 0 ? 'owes group' : 'settled'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: SETTLEMENT GRAPH */}
      {activeTab === 'debts' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Pending Settlements ({activeGroup.simplifyDebts ? 'Simplified' : 'Raw'})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculated to balance every member with the fewest transfers.
              </p>
            </div>
            <button
              onClick={() => onOpenSettleUp()}
              className="py-2 px-3.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs"
            >
              Record Payment
            </button>
          </div>

          {debts.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              🎉 No outstanding debts in this group!
            </div>
          ) : (
            <div className="space-y-3">
              {debts.map((d, index) => {
                const fromMem = memberMap.get(d.from);
                const toMem = memberMap.get(d.to);
                return (
                  <div
                    key={index}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={fromMem?.name || 'Debtor'} size="sm" />
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        <span>{fromMem?.name || 'Someone'}</span>
                        <span className="text-slate-400 font-normal mx-1.5">pays</span>
                        <span>{toMem?.name || 'Someone'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                        {currencySymbol} {d.amount.toFixed(2)}
                      </div>
                      <button
                        onClick={() => onOpenSettleUp(d)}
                        className="py-1 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                      >
                        Settle
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
              Invite to {activeGroup.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Add friends by email or share the invite code.
            </p>

            <form onSubmit={handleSendInvite} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Friend's Name
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Maya"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Friend's Email
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="maya@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
