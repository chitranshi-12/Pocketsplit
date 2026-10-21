import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { useGroups } from '../../context/GroupContext';
import { CURRENCIES, Member, Settlement } from '../../types';
import { Avatar } from '../common/Avatar';
import { UpiQrCode } from './UpiQrCode';
import { 
  ArrowRight, 
  Calendar, 
  Check, 
  CreditCard, 
  FileText, 
  PartyPopper, 
  QrCode, 
  Sparkles, 
  X 
} from 'lucide-react';

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPayerId?: string;
  defaultRecipientId?: string;
  defaultAmount?: number;
}

export const SettleUpModal: React.FC<SettleUpModalProps> = ({
  isOpen,
  onClose,
  defaultPayerId,
  defaultRecipientId,
  defaultAmount,
}) => {
  const { user } = useAuth();
  const { activeGroup, addSettlement, debts } = useGroups();

  const members: Member[] = activeGroup?.members || [];
  const currency = user?.currency || 'INR';
  const currencySymbol = CURRENCIES[currency]?.symbol || '₹';

  const [fromMemberId, setFromMemberId] = useState<string>('');
  const [toMemberId, setToMemberId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash' | 'bank_transfer' | 'card' | 'other'>(
    currency === 'INR' ? 'upi' : 'cash'
  );
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setDate(new Date().toISOString().split('T')[0]);

      // If pre-filled from debt recommendation:
      if (defaultPayerId && defaultRecipientId) {
        setFromMemberId(defaultPayerId);
        setToMemberId(defaultRecipientId);
        setAmount((defaultAmount || 0).toFixed(2));
      } else {
        // Find if current user owes someone
        const userDebt = debts.find((d) => d.from === user?.id);
        if (userDebt) {
          setFromMemberId(userDebt.from);
          setToMemberId(userDebt.to);
          setAmount(userDebt.amount.toFixed(2));
        } else if (debts.length > 0) {
          setFromMemberId(debts[0].from);
          setToMemberId(debts[0].to);
          setAmount(debts[0].amount.toFixed(2));
        } else {
          setFromMemberId(members[0]?.id || '');
          setToMemberId(members[1]?.id || members[0]?.id || '');
          setAmount('0.00');
        }
      }
    }
  }, [isOpen, defaultPayerId, defaultRecipientId, defaultAmount, debts, user?.id]);

  if (!isOpen) return null;

  if (!activeGroup) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center animate-in fade-in">
          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">No Active Group</h3>
          <p className="text-xs text-slate-500 mb-4">Please create or join a group first to settle balances.</p>
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  const numAmount = parseFloat(amount) || 0;
  const toMember = members.find((m) => m.id === toMemberId);
  const fromMember = members.find((m) => m.id === fromMemberId);

  // If INR and payment method is UPI, show QR code and UPI deep link
  const showUpiSection = currency === 'INR' && paymentMethod === 'upi' && numAmount > 0;
  const targetUpiId = toMember?.upiId || (toMemberId === user?.id ? user?.upiId : undefined) || 'pocketsplit@upi';

  const triggerConfettiCelebration = () => {
    try {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#059669', '#10b981', '#f59e0b', '#3b82f6', '#ec4899'],
      });
    } catch (e) {
      // safe fallback if canvas is not mounted
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fromMemberId || !toMemberId) {
      setError('Please select both payer and recipient.');
      return;
    }

    if (fromMemberId === toMemberId) {
      setError('Payer and recipient cannot be the same person.');
      return;
    }

    if (numAmount <= 0) {
      setError('Please enter a valid settlement amount.');
      return;
    }

    setSubmitting(true);
    try {
      await addSettlement({
        groupId: activeGroup.id,
        fromMemberId,
        toMemberId,
        amount: numAmount,
        currency,
        date,
        paymentMethod,
        reference: reference.trim() || undefined,
      });

      // Celebrate full settlement!
      triggerConfettiCelebration();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to record settlement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <PartyPopper className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Record a Payment</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Settle balances in <span className="font-semibold text-slate-700 dark:text-slate-300">{activeGroup.name}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Who Paid Whom visual cards */}
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
            {/* Payer */}
            <div className="flex-1">
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                Who Paid?
              </label>
              <select
                value={fromMemberId}
                onChange={(e) => setFromMemberId(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.id === user?.id ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4 text-emerald-600">
              <ArrowRight className="w-5 h-5" />
            </div>

            {/* Recipient */}
            <div className="flex-1">
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                To Whom?
              </label>
              <select
                value={toMemberId}
                onChange={(e) => setToMemberId(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.id === user?.id ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Amount Paid ({currencySymbol})
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 font-bold text-slate-500 text-base">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'upi', label: 'UPI / QR', icon: '📱' },
                { id: 'cash', label: 'Cash', icon: '💵' },
                { id: 'bank_transfer', label: 'Bank', icon: '🏦' },
                { id: 'card', label: 'Card / Other', icon: '💳' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`py-2 px-2 rounded-xl border text-xs flex flex-col items-center gap-1 transition-all ${
                    paymentMethod === m.id
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 font-bold text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="text-base">{m.icon}</span>
                  <span className="truncate">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* UPI Live QR Code if INR + UPI */}
          {showUpiSection && toMember && (
            <UpiQrCode
              upiId={targetUpiId}
              payeeName={toMember.name}
              amount={numAmount}
              note={`Pocketsplit - ${activeGroup.name}`}
            />
          )}

          {/* Date & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Date</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Payment Reference / Note</span>
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="UPI ref or note..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || numAmount <= 0}
              className="py-2.5 px-6 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{submitting ? 'Recording...' : 'Confirm Settlement'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
