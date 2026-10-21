import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGroups } from '../../context/GroupContext';
import { Logo } from '../common/Logo';
import { Avatar } from '../common/Avatar';
import { CURRENCIES } from '../../types';
import { 
  BarChart3, 
  Clock, 
  Compass, 
  HelpCircle, 
  Home, 
  LogOut, 
  Moon, 
  Plus, 
  Settings, 
  Sun, 
  Users 
} from 'lucide-react';

export type NavTab = 'dashboard' | 'groups' | 'friends' | 'activity' | 'insights' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAddExpense: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddExpense,
  isDark,
  onToggleTheme,
}) => {
  const { user, signOut, isDemoUser } = useAuth();
  const { groups, activeGroupId, setActiveGroupId } = useGroups();

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: Home },
    { id: 'groups' as NavTab, label: 'Groups', icon: Users, count: groups.length },
    { id: 'friends' as NavTab, label: 'Friends & Direct', icon: Compass },
    { id: 'activity' as NavTab, label: 'Activity Feed', icon: Clock },
    { id: 'insights' as NavTab, label: 'Insights & Charts', icon: BarChart3 },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  const currencySymbol = CURRENCIES[user?.currency || 'INR']?.symbol || '₹';

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 sticky top-0 flex-shrink-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/80">
        <Logo size="md" showTagline />
      </div>

      {/* Add Expense Action Button */}
      <div className="p-4">
        <button
          onClick={onOpenAddExpense}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2">
          Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}

        {/* Quick Groups List */}
        {groups.length > 0 && (
          <div className="pt-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 flex items-center justify-between">
              <span>Your Groups</span>
            </div>
            <div className="space-y-0.5 mt-1">
              {groups.map((group) => {
                const isSelected = activeGroupId === group.id && currentTab === 'groups';
                return (
                  <button
                    key={group.id}
                    onClick={() => {
                      setActiveGroupId(group.id);
                      onSelectTab('groups');
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors ${
                      isSelected
                        ? 'bg-slate-100 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="text-sm">{group.emoji || '👥'}</span>
                    <span className="truncate text-left flex-1">{group.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Theme & Profile Footer */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between px-2 pb-3 mb-2 border-b border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Currency:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
              {currencySymbol} {user?.currency || 'INR'}
            </span>
          </div>

          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>

        {/* User Badge */}
        {user && (
          <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar name={user.name} avatarUrl={user.avatar} size="sm" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                  {isDemoUser && <span className="text-amber-500 font-semibold">[Demo]</span>}
                  <span>{user.email}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => signOut()}
              className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
