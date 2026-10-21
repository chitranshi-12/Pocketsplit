import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGroups } from '../../context/GroupContext';
import { CURRENCIES, Comment, Expense, Member } from '../../types';
import { Avatar } from '../common/Avatar';
import { 
  Calendar, 
  Clock, 
  CreditCard, 
  Edit3, 
  FileText, 
  MessageSquare, 
  PieChart, 
  Repeat, 
  Send, 
  Split, 
  Trash2, 
  X 
} from 'lucide-react';

interface ExpenseDetailModalProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (expense: Expense) => void;
}

export const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({
  expense,
  isOpen,
  onClose,
  onEdit,
}) => {
  const { user } = useAuth();
  const { activeGroup, comments, addComment, deleteExpense } = useGroups();
  const [commentText, setCommentText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!isOpen || !expense || !activeGroup) return null;

  const members: Member[] = activeGroup.members;
  const memberMap = new Map<string, Member>();
  members.forEach((m) => memberMap.set(m.id, m));

  const currencySymbol = CURRENCIES[expense.currency || 'INR']?.symbol || '₹';
  const expenseComments = comments.filter((c) => c.expenseId === expense.id);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await addComment(expense.id, commentText.trim());
      setCommentText('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteExpense(expense.id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
              {expense.category}
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate mt-1">
              {expense.description}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => {
                onClose();
                onEdit(expense);
              }}
              className="p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Edit expense"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Delete expense"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Banner */}
        {showDeleteConfirm && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border-b border-rose-200 dark:border-rose-900 flex items-center justify-between text-xs">
            <span className="text-rose-700 dark:text-rose-300 font-semibold">
              Delete this expense permanently?
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-2.5 py-1 rounded bg-rose-600 text-white font-bold"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Big Amount Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Total Bill Amount</span>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {currencySymbol} {expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="flex flex-col items-end text-xs text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{new Date(expense.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              {expense.recurring && expense.recurring !== 'none' && (
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <Repeat className="w-3.5 h-3.5" />
                  <span className="capitalize">{expense.recurring}</span>
                </div>
              )}
            </div>
          </div>

          {/* Paid By Breakdown */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Paid By</span>
            </h4>
            <div className="space-y-1.5">
              {expense.paidBy.map((p) => {
                const payerMember = memberMap.get(p.memberId);
                return (
                  <div
                    key={p.memberId}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar name={payerMember?.name || 'Unknown'} size="xs" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {payerMember?.name || 'Unknown'}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {currencySymbol} {p.amount.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Split Shares Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5" />
                <span>Split Breakdown ({expense.splitType})</span>
              </h4>
              <span className="text-[11px] text-slate-400">
                {expense.participantIds.length} people involved
              </span>
            </div>

            <div className="space-y-1.5">
              {expense.splitDetails.map((detail) => {
                const partMember = memberMap.get(detail.memberId);
                return (
                  <div
                    key={detail.memberId}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar name={partMember?.name || 'Unknown'} size="xs" />
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {partMember?.name || 'Unknown'}
                      </span>
                      {detail.percentage !== undefined && (
                        <span className="text-[10px] text-slate-400">({detail.percentage}%)</span>
                      )}
                      {detail.share !== undefined && (
                        <span className="text-[10px] text-slate-400">({detail.share} share)</span>
                      )}
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {currencySymbol} {detail.amount.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes or Receipt Image */}
          {expense.notes && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 text-xs">
              <span className="font-bold text-slate-500 block mb-1">Notes:</span>
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{expense.notes}</p>
            </div>
          )}

          {expense.receiptUrl && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Attached Receipt Photo
              </h4>
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-60 bg-black flex items-center justify-center">
                <img
                  src={expense.receiptUrl}
                  alt="Receipt"
                  className="max-h-60 object-contain hover:scale-105 transition-transform cursor-pointer"
                  onClick={() => window.open(expense.receiptUrl, '_blank')}
                  title="Click to view full image"
                />
              </div>
            </div>
          )}

          {/* Comments Discussion Section */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Comments & Activity ({expenseComments.length})</span>
            </h4>

            <div className="space-y-2 mb-3">
              {expenseComments.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-400">
                  No comments yet. Have a question about this bill? Ask below!
                </div>
              ) : (
                expenseComments.map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                        <Avatar name={c.userName} avatarUrl={c.userAvatar} size="xs" />
                        <span>{c.userName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 pl-6">{c.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Post comment input */}
            <form onSubmit={handlePostComment} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors"
                title="Send comment"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
