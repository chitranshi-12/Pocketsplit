import React from 'react';
import { NavTab } from './Sidebar';
import { BarChart3, Clock, Compass, Home, Plus, Users } from 'lucide-react';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAddExpense: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab, onOpenAddExpense }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 px-3 py-1.5 flex items-center justify-around">
      <button
        onClick={() => onSelectTab('dashboard')}
        className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
          currentTab === 'dashboard'
            ? 'text-emerald-600 dark:text-emerald-400 font-bold'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <Home className="w-5 h-5 mb-0.5" />
        <span>Dashboard</span>
      </button>

      <button
        onClick={() => onSelectTab('groups')}
        className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
          currentTab === 'groups'
            ? 'text-emerald-600 dark:text-emerald-400 font-bold'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <Users className="w-5 h-5 mb-0.5" />
        <span>Groups</span>
      </button>

      {/* Floating Center "+" Add Expense Button */}
      <div className="-mt-6 flex flex-col items-center">
        <button
          onClick={onOpenAddExpense}
          className="w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/40 active:scale-95 transition-all ring-4 ring-white dark:ring-slate-900"
          title="Add Expense"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      <button
        onClick={() => onSelectTab('friends')}
        className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
          currentTab === 'friends'
            ? 'text-emerald-600 dark:text-emerald-400 font-bold'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <Compass className="w-5 h-5 mb-0.5" />
        <span>Friends</span>
      </button>

      <button
        onClick={() => onSelectTab('insights')}
        className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
          currentTab === 'insights'
            ? 'text-emerald-600 dark:text-emerald-400 font-bold'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <BarChart3 className="w-5 h-5 mb-0.5" />
        <span>Insights</span>
      </button>
    </div>
  );
};
