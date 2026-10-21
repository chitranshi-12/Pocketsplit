import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGroups } from '../../context/GroupContext';
import { CURRENCIES, Expense, ExpenseCategory, Member, Payer, SplitType } from '../../types';
import { computeSplitAllocations, toSubunits } from '../../services/debtSimplification';
import { scanReceiptWithGemini } from '../../services/geminiReceipt';
import { Avatar } from '../common/Avatar';
import { 
  AlertCircle, 
  ArrowRight, 
  Calendar, 
  Camera, 
  Check, 
  CreditCard, 
  FileText, 
  Layers, 
  Minus, 
  Percent, 
  Plus, 
  Receipt, 
  Repeat, 
  Sparkles, 
  Split, 
  Trash2, 
  Upload, 
  UserPlus, 
  Users, 
  Wand2, 
  X 
} from 'lucide-react';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editExpense?: Expense | null;
}

const CATEGORIES: { label: ExpenseCategory; icon: string }[] = [
  { label: 'Food & Drink', icon: '🍔' },
  { label: 'Groceries', icon: '🛒' },
  { label: 'Transportation', icon: '🚗' },
  { label: 'Rent & Housing', icon: '🏠' },
  { label: 'Utilities', icon: '⚡' },
  { label: 'Entertainment', icon: '🍿' },
  { label: 'Shopping', icon: '🛍️' },
  { label: 'Travel & Flight', icon: '✈️' },
  { label: 'Health', icon: '💊' },
  { label: 'General', icon: '🧾' },
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, editExpense }) => {
  const { user } = useAuth();
  const { activeGroup, addExpense, updateExpense, inviteMember } = useGroups();

  const members: Member[] = activeGroup?.members || [];
  const currency = user?.currency || 'INR';
  const currencySymbol = CURRENCIES[currency]?.symbol || '₹';

  // Form Fields
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<ExpenseCategory>('Food & Drink');
  const [notes, setNotes] = useState('');
  const [recurring, setRecurring] = useState<'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('none');
  const [receiptUrl, setReceiptUrl] = useState<string>('');

  // Payer state: Single or Multi-payer
  const [isMultiPayer, setIsMultiPayer] = useState(false);
  const [singlePayerId, setSinglePayerId] = useState<string>(user?.id || members[0]?.id || '');
  const [multiPayers, setMultiPayers] = useState<Record<string, number>>({});

  // Split state
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [exactAmounts, setExactAmounts] = useState<Record<string, number>>({});
  const [percentages, setPercentages] = useState<Record<string, number>>({});
  const [shares, setShares] = useState<Record<string, number>>({});
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});

  // Inline Quick Add Person state
  const [showAddPersonInput, setShowAddPersonInput] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');

  // Scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize form
  useEffect(() => {
    if (isOpen) {
      if (editExpense) {
        setDescription(editExpense.description);
        setAmount(editExpense.amount.toString());
        setDate(editExpense.date);
        setCategory(editExpense.category);
        setNotes(editExpense.notes || '');
        setRecurring(editExpense.recurring || 'none');
        setReceiptUrl(editExpense.receiptUrl || '');
        setSplitType(editExpense.splitType);
        setSelectedParticipants(editExpense.participantIds);

        if (editExpense.paidBy.length > 1) {
          setIsMultiPayer(true);
          const payerMap: Record<string, number> = {};
          editExpense.paidBy.forEach((p) => (payerMap[p.memberId] = p.amount));
          setMultiPayers(payerMap);
        } else {
          setIsMultiPayer(false);
          setSinglePayerId(editExpense.paidBy[0]?.memberId || user?.id || '');
        }

        const exactMap: Record<string, number> = {};
        const pctMap: Record<string, number> = {};
        const shareMap: Record<string, number> = {};
        const adjMap: Record<string, number> = {};

        editExpense.splitDetails.forEach((d) => {
          if (d.share !== undefined) shareMap[d.memberId] = d.share;
          if (d.percentage !== undefined) pctMap[d.memberId] = d.percentage;
          if (d.adjustment !== undefined) adjMap[d.memberId] = d.adjustment;
          exactMap[d.memberId] = d.amount;
        });

        setExactAmounts(exactMap);
        setPercentages(pctMap);
        setShares(shareMap);
        setAdjustments(adjMap);
      } else {
        setDescription('');
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        setCategory('Food & Drink');
        setNotes('');
        setRecurring('none');
        setReceiptUrl('');
        setSplitType('equal');
        setSinglePayerId(user?.id || members[0]?.id || '');
        setIsMultiPayer(false);
        setMultiPayers({});
        
        const allIds = members.map((m) => m.id);
        setSelectedParticipants(allIds);

        const initialShares: Record<string, number> = {};
        allIds.forEach((id) => (initialShares[id] = 1));
        setShares(initialShares);
        setExactAmounts({});
        setPercentages({});
        setAdjustments({});
      }
      setFormError(null);
      setScanMessage(null);
      setShowAddPersonInput(false);
      setNewPersonName('');
    }
  }, [isOpen, editExpense, activeGroup?.id, user?.id]);

  if (!isOpen) return null;

  if (!activeGroup) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center animate-in fade-in">
          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">No Active Group</h3>
          <p className="text-xs text-slate-500 mb-4">Please create or select a group to start adding and splitting expenses.</p>
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const numAmount = parseFloat(amount) || 0;
  const totalSubunits = toSubunits(numAmount);

  // Multi-payer calculations
  const multiPayerSum = Object.values(multiPayers).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const multiPayerDiffCents = totalSubunits - toSubunits(multiPayerSum);

  // Live split calculations
  const computedSplits = computeSplitAllocations(numAmount, selectedParticipants, splitType, {
    exactAmounts,
    percentages,
    shares,
    adjustments,
  });

  const assignedCents = computedSplits.reduce((acc, s) => acc + toSubunits(s.amount), 0);
  const remainingCents = totalSubunits - assignedCents;
  const isSplitValid = numAmount > 0 && selectedParticipants.length > 0 && Math.abs(remainingCents) <= 1;

  // Handle Quick Add Person directly to this group and bill
  const handleQuickAddPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonName.trim()) return;

    const trimmed = newPersonName.trim();
    const fakeEmail = `${trimmed.toLowerCase().replace(/\s+/g, '')}@pocketsplit.local`;
    
    try {
      await inviteMember(activeGroup.id, fakeEmail, trimmed);
      // Automatically include new member
      setNewPersonName('');
      setShowAddPersonInput(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to auto-fill exact split equally
  const handleAutoFillExactEqually = () => {
    if (selectedParticipants.length === 0 || numAmount <= 0) return;
    const equalShare = parseFloat((numAmount / selectedParticipants.length).toFixed(2));
    const newExact: Record<string, number> = {};
    selectedParticipants.forEach((id) => {
      newExact[id] = equalShare;
    });
    setExactAmounts(newExact);
  };

  // Helper to assign remaining amount to a specific person
  const handleAssignRemainingTo = (memberId: string) => {
    const currentVal = exactAmounts[memberId] || 0;
    const additional = remainingCents / 100;
    setExactAmounts({
      ...exactAmounts,
      [memberId]: Math.max(0, parseFloat((currentVal + additional).toFixed(2))),
    });
  };

  // Gemini Scan
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setReceiptUrl(base64Data);

      setIsScanning(true);
      setScanMessage('Scanning receipt with Gemini AI...');
      try {
        const parsed = await scanReceiptWithGemini(base64Data);
        if (parsed.totalAmount && parsed.totalAmount > 0) {
          setAmount(parsed.totalAmount.toString());
        }
        if (parsed.merchant || parsed.description) {
          setDescription(parsed.description || parsed.merchant || '');
        }
        if (parsed.date) {
          setDate(parsed.date);
        }
        if (parsed.category) {
          setCategory(parsed.category);
        }
        setScanMessage(`✨ Extracted: ${parsed.merchant || 'Receipt'} (${currencySymbol} ${parsed.totalAmount || 0})`);
      } catch (err: any) {
        setScanMessage('Photo attached. Please enter amount and details.');
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleToggleParticipant = (id: string) => {
    if (selectedParticipants.includes(id)) {
      if (selectedParticipants.length <= 1) return;
      setSelectedParticipants(selectedParticipants.filter((p) => p !== id));
    } else {
      setSelectedParticipants([...selectedParticipants, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!description.trim()) {
      setFormError('Please enter an expense description.');
      return;
    }

    if (numAmount <= 0) {
      setFormError('Please enter an amount greater than zero.');
      return;
    }

    if (selectedParticipants.length === 0) {
      setFormError('Select at least one participant.');
      return;
    }

    // Payer list
    let payersList: Payer[] = [];
    if (isMultiPayer) {
      if (Math.abs(multiPayerDiffCents) > 1) {
        setFormError(
          `Payer amounts (${currencySymbol} ${multiPayerSum.toFixed(2)}) must equal total (${currencySymbol} ${numAmount.toFixed(2)})`
        );
        return;
      }
      payersList = Object.entries(multiPayers)
        .filter(([_, amt]) => amt > 0)
        .map(([memberId, amt]) => ({ memberId, amount: Number(amt) }));
    } else {
      payersList = [{ memberId: singlePayerId, amount: numAmount }];
    }

    if (payersList.length === 0) {
      setFormError('Please specify who paid for this expense.');
      return;
    }

    if (!isSplitValid) {
      setFormError(
        `Split amounts do not equal total. Remaining: ${currencySymbol} ${(remainingCents / 100).toFixed(2)}`
      );
      return;
    }

    setSubmitting(true);
    try {
      const expensePayload = {
        groupId: activeGroup.id,
        description: description.trim(),
        amount: numAmount,
        currency,
        category,
        date,
        paidBy: payersList,
        splitType,
        splitDetails: computedSplits,
        participantIds: selectedParticipants,
        notes: notes.trim() || undefined,
        receiptUrl: receiptUrl || undefined,
        recurring,
      };

      if (editExpense) {
        await updateExpense(editExpense.id, expensePayload);
      } else {
        await addExpense(expensePayload);
      }

      onClose();
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Failed to save expense.');
    } finally {
      setSubmitting(false);
    }
  };

  // Pre-calculated payer map for live summary
  const payerMap = new Map<string, number>();
  if (isMultiPayer) {
    Object.entries(multiPayers).forEach(([id, amt]) => payerMap.set(id, amt));
  } else {
    payerMap.set(singlePayerId, numAmount);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
              {editExpense ? 'Edit Expense' : 'Add Expense'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              In group <span className="font-bold text-slate-700 dark:text-slate-300">{activeGroup.name}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {formError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {scanMessage && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse flex-shrink-0" />
              <span>{scanMessage}</span>
            </div>
          )}

          {/* Description & Amount Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-7">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Description
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Thalassa Seafood Dinner"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Total Bill Amount ({currencySymbol})
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 font-extrabold text-slate-500 text-base">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-lg font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Scan Receipt Action Callout */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                <Camera className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-900 dark:text-white block">Got a receipt photo?</span>
                <span className="text-[11px] text-slate-500">Gemini extracts merchant & total bill</span>
              </div>
            </div>

            <label className="cursor-pointer text-xs font-bold py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              <span>{isScanning ? 'Scanning...' : 'Scan Photo'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleReceiptUpload}
                disabled={isScanning}
                className="hidden"
              />
            </label>
          </div>

          {/* Category Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.label;
                return (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() => setCategory(cat.label)}
                    className={`p-2 rounded-xl border text-xs flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 font-bold text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-base">{cat.icon}</span>
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 1: WHO PAID */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Who Paid the Bill?</span>
              </span>

              <button
                type="button"
                onClick={() => setIsMultiPayer(!isMultiPayer)}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                {isMultiPayer ? 'Single person paid' : 'Multiple people paid?'}
              </button>
            </div>

            {!isMultiPayer ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {members.map((m) => {
                  const isPayer = singlePayerId === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSinglePayerId(m.id)}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs transition-all ${
                        isPayer
                          ? 'border-emerald-500 bg-emerald-600 text-white font-bold shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <Avatar name={m.name} size="xs" />
                      <span className="truncate font-semibold">{m.name}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Enter how much each person paid towards the total of {currencySymbol} {numAmount.toFixed(2)}:
                </div>
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-3 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={m.name} size="xs" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {m.name}
                      </span>
                    </div>
                    <div className="relative w-32">
                      <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">{currencySymbol}</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={multiPayers[m.id] ?? ''}
                        onChange={(e) =>
                          setMultiPayers({
                            ...multiPayers,
                            [m.id]: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="0.00"
                        className="w-full pl-6 pr-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 font-bold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: HOW TO SPLIT & ADDING OTHER PEOPLE'S SHARES */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Split className="w-4 h-4 text-emerald-600" />
                <span>Split Between ({selectedParticipants.length} people)</span>
              </span>

              {/* Live Remaining Balance Pill */}
              <div
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                  isSplitValid
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                }`}
              >
                {isSplitValid ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Balanced 100%</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>
                      {remainingCents > 0
                        ? `${currencySymbol} ${(remainingCents / 100).toFixed(2)} left to assign`
                        : `${currencySymbol} ${(Math.abs(remainingCents) / 100).toFixed(2)} over`
                      }
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Split Type Selector Tabs */}
            <div className="grid grid-cols-5 gap-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold">
              {[
                { id: 'equal', label: 'Equally' },
                { id: 'exact', label: 'Exact ₹' },
                { id: 'percentage', label: '% Pct' },
                { id: 'shares', label: 'Shares' },
                { id: 'adjustment', label: '+/- Adj' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSplitType(tab.id as SplitType)}
                  className={`py-1.5 rounded-xl transition-all ${
                    splitType === tab.id
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Helper tools for Exact mode */}
            {splitType === 'exact' && (
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[11px] text-slate-500">
                  Type each person's exact share below:
                </span>
                <button
                  type="button"
                  onClick={handleAutoFillExactEqually}
                  className="font-bold text-emerald-600 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>Divide Remaining Equally</span>
                </button>
              </div>
            )}

            {/* Members Split Allocations */}
            <div className="space-y-2">
              {members.map((m) => {
                const isIncluded = selectedParticipants.includes(m.id);
                const assignedObj = computedSplits.find((s) => s.memberId === m.id);
                const shareAmount = assignedObj ? assignedObj.amount : 0;

                return (
                  <div
                    key={m.id}
                    className={`flex items-center justify-between p-2.5 rounded-2xl transition-all ${
                      isIncluded
                        ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs'
                        : 'opacity-40 bg-slate-100 dark:bg-slate-900 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isIncluded}
                        onChange={() => handleToggleParticipant(m.id)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <Avatar name={m.name} size="xs" />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                          {m.name}
                        </span>
                        {isIncluded && (
                          <span className="text-[10px] text-slate-400">
                            {splitType === 'equal' && `Exact equal share`}
                            {splitType === 'exact' && `Custom entered amount`}
                            {splitType === 'shares' && `${shares[m.id] || 1} parts of total`}
                            {splitType === 'percentage' && `${percentages[m.id] || 0}% of total`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Inputs depending on split type */}
                    <div className="flex items-center gap-2">
                      {/* Exact Mode: Direct input with Quick Assign button */}
                      {splitType === 'exact' && isIncluded && (
                        <div className="flex items-center gap-1.5">
                          <div className="relative w-28">
                            <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">
                              {currencySymbol}
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              value={exactAmounts[m.id] ?? ''}
                              onChange={(e) =>
                                setExactAmounts({
                                  ...exactAmounts,
                                  [m.id]: parseFloat(e.target.value) || 0,
                                })
                              }
                              placeholder="0.00"
                              className="w-full pl-6 pr-2 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 font-extrabold text-slate-900 dark:text-white"
                            />
                          </div>
                          {remainingCents !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleAssignRemainingTo(m.id)}
                              className="text-[10px] font-bold py-1 px-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100"
                              title="Assign unassigned remainder to this person"
                            >
                              +Rest
                            </button>
                          )}
                        </div>
                      )}

                      {/* Percentage Mode */}
                      {splitType === 'percentage' && isIncluded && (
                        <div className="relative w-24">
                          <input
                            type="number"
                            step="1"
                            value={percentages[m.id] ?? ''}
                            onChange={(e) =>
                              setPercentages({
                                ...percentages,
                                [m.id]: parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="0"
                            className="w-full pr-6 pl-2.5 py-1 text-xs rounded-xl border border-slate-300 dark:border-slate-600 font-extrabold text-slate-900 dark:text-white"
                          />
                          <span className="absolute right-2.5 top-1 text-xs text-slate-400 font-bold">%</span>
                        </div>
                      )}

                      {/* Shares Mode: + and - buttons */}
                      {splitType === 'shares' && isIncluded && (
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() =>
                              setShares({
                                ...shares,
                                [m.id]: Math.max(1, (shares[m.id] || 1) - 1),
                              })
                            }
                            className="w-5 h-5 rounded-md bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-200"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold px-2 text-slate-800 dark:text-slate-100">
                            {shares[m.id] || 1}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setShares({
                                ...shares,
                                [m.id]: (shares[m.id] || 1) + 1,
                              })
                            }
                            className="w-5 h-5 rounded-md bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-200"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* Adjustment Mode */}
                      {splitType === 'adjustment' && isIncluded && (
                        <div className="relative w-24">
                          <span className="absolute left-2 top-1 text-[11px] text-slate-400">+/-</span>
                          <input
                            type="number"
                            step="0.01"
                            value={adjustments[m.id] ?? ''}
                            onChange={(e) =>
                              setAdjustments({
                                ...adjustments,
                                [m.id]: parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="0.00"
                            className="w-full pl-6 pr-2 py-1 text-xs rounded-xl border border-slate-300 dark:border-slate-600 font-bold"
                          />
                        </div>
                      )}

                      {/* Final calculated share amount display */}
                      <span className="text-xs font-black text-slate-900 dark:text-white min-w-16 text-right">
                        {currencySymbol} {shareAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Add Person to this bill directly */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
              {!showAddPersonInput ? (
                <button
                  type="button"
                  onClick={() => setShowAddPersonInput(true)}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Add another person to this bill</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                    placeholder="Enter friend or roommate name..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 font-medium"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddPerson}
                    disabled={!newPersonName.trim()}
                    className="py-1.5 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddPersonInput(false)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: THE LIVE SUMMARY CARD: "HOW MUCH EVERYONE HAS TO PAY" */}
          {numAmount > 0 && selectedParticipants.length > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-transparent border-2 border-emerald-500/30 dark:border-emerald-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    Summary: Exactly How Much Everyone Has To Pay
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                  Total: {currencySymbol} {numAmount.toFixed(2)}
                </span>
              </div>

              <div className="space-y-2">
                {members
                  .filter((m) => selectedParticipants.includes(m.id) || (payerMap.get(m.id) || 0) > 0)
                  .map((m) => {
                    const paidAmt = payerMap.get(m.id) || 0;
                    const assignedShare = computedSplits.find((s) => s.memberId === m.id)?.amount || 0;
                    const netEffect = paidAmt - assignedShare; // positive = gets back, negative = owes

                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-xs shadow-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar name={m.name} size="xs" />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {m.name} {m.id === user?.id ? '(You)' : ''}
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              Share: {currencySymbol} {assignedShare.toFixed(2)} • Paid: {currencySymbol} {paidAmt.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          {netEffect > 0 ? (
                            <div className="font-black text-emerald-600 dark:text-emerald-400 text-xs">
                              Gets back {currencySymbol} {netEffect.toFixed(2)}
                            </div>
                          ) : netEffect < 0 ? (
                            <div className="font-black text-rose-600 dark:text-rose-400 text-xs">
                              Has to pay {currencySymbol} {Math.abs(netEffect).toFixed(2)}
                            </div>
                          ) : (
                            <div className="font-bold text-slate-400 text-xs">All even (₹0.00)</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Date, Recurring & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Date</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-slate-400" />
                <span>Recurring Expense</span>
              </label>
              <select
                value={recurring}
                onChange={(e) => setRecurring(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
              >
                <option value="none">One-time expense</option>
                <option value="weekly">Repeats Weekly</option>
                <option value="monthly">Repeats Monthly (Rent / Wifi)</option>
                <option value="yearly">Repeats Yearly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Notes (Optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add payment notes, invoice ID, or memo..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !isSplitValid || numAmount <= 0}
              className={`py-3 px-6 rounded-xl text-xs font-black text-white shadow-lg transition-all flex items-center gap-2 ${
                isSplitValid && numAmount > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30 active:scale-[0.98]'
                  : 'bg-slate-400 cursor-not-allowed'
              }`}
            >
              <span>{submitting ? 'Saving...' : editExpense ? 'Update Expense' : 'Save & Split Expense'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
