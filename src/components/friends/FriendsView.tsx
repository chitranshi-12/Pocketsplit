import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGroups } from '../../context/GroupContext';
import { CURRENCIES, Debt, Member } from '../../types';
import { Avatar } from '../common/Avatar';
import { 
  BellRing, 
  Check, 
  CreditCard, 
  MessageCircle, 
  Plus, 
  Send, 
  Share2, 
  UserCheck, 
  UserPlus, 
  Users 
} from 'lucide-react';

interface FriendsViewProps {
  onOpenSettleUp: (debt?: Debt) => void;
  onOpenAddExpense: () => void;
}

export const FriendsView: React.FC<FriendsViewProps> = ({ onOpenSettleUp, onOpenAddExpense }) => {
  const { user } = useAuth();
  const { groups, debts } = useGroups();
  const currencySymbol = CURRENCIES[user?.currency || 'INR']?.symbol || '₹';

  // Aggregate unique friends from all groups
  const friendsMap = new Map<string, { member: Member; groupNames: string[]; balance: number }>();

  groups.forEach((g) => {
    g.members.forEach((m) => {
      if (m.id === user?.id) return;
      if (!friendsMap.has(m.id)) {
        friendsMap.set(m.id, { member: m, groupNames: [g.name], balance: 0 });
      } else {
        const item = friendsMap.get(m.id)!;
        if (!item.groupNames.includes(g.name)) {
          item.groupNames.push(g.name);
        }
      }
    });
  });

  // Calculate pairwise debts for each friend
  debts.forEach((d) => {
    if (d.from === user?.id && friendsMap.has(d.to)) {
      // Current user owes this friend
      friendsMap.get(d.to)!.balance -= d.amount;
    } else if (d.to === user?.id && friendsMap.has(d.from)) {
      // Friend owes current user
      friendsMap.get(d.from)!.balance += d.amount;
    }
  });

  const friendsList = Array.from(friendsMap.values());

  const handleNudgeViaWhatsApp = (friend: Member, balance: number) => {
    const text = `Hey ${friend.name}! Just a gentle nudge about ${currencySymbol} ${balance.toFixed(
      2
    )} on Pocketsplit. You can settle up whenever you get a chance: ${window.location.origin}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Friends & Balances
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track direct balances across all groups, settle up, and send polite payment nudges.
          </p>
        </div>

        <button
          onClick={onOpenAddExpense}
          className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Split Bill with Friend</span>
        </button>
      </div>

      {/* Friends Cards */}
      {friendsList.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">No friends found yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Create a group or invite friends to track shared expenses together.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {friendsList.map(({ member, groupNames, balance }) => {
            const owesYou = balance > 0;
            const youOwe = balance < 0;

            return (
              <div
                key={member.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={member.name} avatarUrl={member.avatar} size="md" />
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {member.name}
                      </h3>
                      <p className="text-xs text-slate-400 truncate max-w-[180px]">
                        In {groupNames.join(', ')}
                      </p>
                      {member.upiId && (
                        <span className="text-[10px] text-emerald-600 font-mono">
                          UPI: {member.upiId}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-lg font-extrabold ${
                        owesYou
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : youOwe
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {owesYou ? '+' : ''}{currencySymbol} {Math.abs(balance).toFixed(2)}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {owesYou ? 'owes you' : youOwe ? 'you owe' : 'settled up'}
                    </span>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  {owesYou ? (
                    <button
                      type="button"
                      onClick={() => handleNudgeViaWhatsApp(member, balance)}
                      className="py-1.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-100 flex items-center gap-1.5 transition-colors"
                      title="Send friendly reminder message via WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Nudge on WhatsApp</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">
                      {youOwe ? 'Pay to clear debt' : 'No balance due'}
                    </span>
                  )}

                  <button
                    onClick={() =>
                      onOpenSettleUp({
                        from: youOwe ? user!.id : member.id,
                        to: youOwe ? member.id : user!.id,
                        amount: Math.abs(balance),
                        currency: user?.currency || 'INR',
                      })
                    }
                    disabled={balance === 0}
                    className={`py-1.5 px-3 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                      balance !== 0
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Settle</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
