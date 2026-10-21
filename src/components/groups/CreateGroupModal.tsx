import React, { useState } from 'react';
import { useGroups } from '../../context/GroupContext';
import { GroupType } from '../../types';
import { Plus, Users, X } from 'lucide-react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMOJIS = ['🏖️', '🏠', '🍷', '🚗', '✈️', '🍕', '🎉', '🏕️', '⛷️', '☕', '💡', '🎮'];
const COLORS = [
  { id: 'emerald', bg: 'bg-emerald-500' },
  { id: 'teal', bg: 'bg-teal-500' },
  { id: 'indigo', bg: 'bg-indigo-500' },
  { id: 'rose', bg: 'bg-rose-500' },
  { id: 'amber', bg: 'bg-amber-500' },
  { id: 'sky', bg: 'bg-sky-500' },
];

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose }) => {
  const { createGroup } = useGroups();
  const [name, setName] = useState('');
  const [type, setType] = useState<GroupType>('Trip');
  const [emoji, setEmoji] = useState('🏖️');
  const [color, setColor] = useState('emerald');
  const [inviteEmails, setInviteEmails] = useState<string[]>(['']);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddEmailField = () => {
    setInviteEmails([...inviteEmails, '']);
  };

  const handleEmailChange = (index: number, val: string) => {
    const updated = [...inviteEmails];
    updated[index] = val;
    setInviteEmails(updated);
  };

  const handleRemoveEmailField = (index: number) => {
    if (inviteEmails.length <= 1) return;
    setInviteEmails(inviteEmails.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide a group name.');
      return;
    }

    setSubmitting(true);
    try {
      const validEmails = inviteEmails.map((e) => e.trim()).filter((e) => e.length > 0);
      await createGroup(name.trim(), type, emoji, color, validEmails);
      onClose();
      // Reset
      setName('');
      setInviteEmails(['']);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Create a New Group</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Share bills with friends or flatmates</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Group Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Manali Road Trip or Flat 301"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Group Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Group Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['Trip', 'Home', 'Couple', 'Other'] as GroupType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    type === t
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Emoji & Color */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Emoji Icon
              </label>
              <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                {EMOJIS.slice(0, 8).map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setEmoji(em)}
                    className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-transform ${
                      emoji === em ? 'bg-white dark:bg-slate-700 shadow-xs scale-110' : 'hover:scale-105'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cover Accent
              </label>
              <div className="flex flex-wrap gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 items-center">
                {COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    className={`w-6 h-6 rounded-full ${c.bg} transition-all ${
                      color === c.id ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110' : 'opacity-80 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Invite Members By Email */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Invite Members by Email
              </label>
              <button
                type="button"
                onClick={handleAddEmailField}
                className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add member</span>
              </button>
            </div>

            <div className="space-y-2">
              {inviteEmails.map((email, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(index, e.target.value)}
                    placeholder="friend@example.com"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                  {inviteEmails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveEmailField(index)}
                      className="p-2 text-slate-400 hover:text-rose-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="py-2.5 px-5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-[0.98]"
            >
              {submitting ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
