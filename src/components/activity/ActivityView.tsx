import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGroups } from '../../context/GroupContext';
import { CURRENCIES } from '../../types';
import { Avatar } from '../common/Avatar';
import { 
  Clock, 
  CreditCard, 
  Edit3, 
  PartyPopper, 
  Plus, 
  Receipt, 
  Sparkles, 
  Trash2, 
  Users 
} from 'lucide-react';

export const ActivityView: React.FC = () => {
  const { user } = useAuth();
  const { activities, activeGroup } = useGroups();
  const currencySymbol = CURRENCIES[user?.currency || 'INR']?.symbol || '₹';

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'expense_added':
        return <Receipt className="w-4 h-4 text-emerald-600" />;
      case 'expense_updated':
        return <Edit3 className="w-4 h-4 text-amber-600" />;
      case 'expense_deleted':
        return <Trash2 className="w-4 h-4 text-rose-600" />;
      case 'settlement_added':
        return <CreditCard className="w-4 h-4 text-teal-600" />;
      case 'member_joined':
      case 'group_created':
        return <Users className="w-4 h-4 text-indigo-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Activity Trail
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Real-time chronological timeline of expenses, edits, settlements, and member changes.
        </p>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">No activity yet</h3>
          <p className="text-xs text-slate-500 mt-1">
            New expenses and settlements will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 sm:p-6 divide-y divide-slate-100 dark:divide-slate-800/80">
          {activities.map((act) => {
            const dateObj = new Date(act.timestamp);
            const formattedTime = dateObj.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={act.id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {getActivityIcon(act.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-snug">
                      <span className="font-bold text-slate-900 dark:text-white">{act.userName}</span>{' '}
                      {act.message}
                    </p>
                    <span className="text-[11px] text-slate-400 flex-shrink-0">
                      {formattedTime}
                    </span>
                  </div>

                  {act.groupName && (
                    <span className="inline-block mt-1 text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {act.groupName}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
