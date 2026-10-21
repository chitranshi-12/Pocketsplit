import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GroupProvider, useGroups } from './context/GroupContext';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { LandingPage } from './components/auth/LandingPage';
import { OnboardingModal } from './components/auth/OnboardingModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { GroupDetailView } from './components/groups/GroupDetailView';
import { FriendsView } from './components/friends/FriendsView';
import { ActivityView } from './components/activity/ActivityView';
import { InsightsView } from './components/insights/InsightsView';
import { SettingsView } from './components/settings/SettingsView';
import { AddExpenseModal } from './components/expenses/AddExpenseModal';
import { ExpenseDetailModal } from './components/expenses/ExpenseDetailModal';
import { SettleUpModal } from './components/settle/SettleUpModal';
import { CreateGroupModal } from './components/groups/CreateGroupModal';
import { Logo } from './components/common/Logo';
import { Avatar } from './components/common/Avatar';
import { Debt, Expense } from './types';
import { Moon, Plus, Sun } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { groups, activeGroup, setActiveGroupId } = useGroups();

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    return (
      localStorage.getItem('pocketsplit_theme') === 'dark' ||
      (!('pocketsplit_theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('pocketsplit_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pocketsplit_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  // Modals state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);
  const [settleDebt, setSettleDebt] = useState<Debt | undefined>(undefined);

  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  // Handlers
  const handleOpenAddExpense = () => {
    setEditingExpense(null);
    setIsAddExpenseOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsAddExpenseOpen(true);
  };

  const handleSelectExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDetailOpen(true);
  };

  const handleOpenSettleUp = (debt?: Debt) => {
    setSettleDebt(debt);
    setIsSettleUpOpen(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center animate-spin mb-4">
          <div className="w-4 h-4 rounded-full bg-emerald-500" />
        </div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Loading Pocketsplit...
        </p>
      </div>
    );
  }

  // If not logged in -> render landing page
  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col md:flex-row antialiased">
      {/* Desktop Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAddExpense={handleOpenAddExpense}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile Top Header */}
        <header className="md:hidden sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 h-15 flex items-center justify-between">
          <Logo size="sm" />

          <div className="flex items-center gap-2">
            {groups.length > 0 && (
              <select
                value={activeGroup?.id || ''}
                onChange={(e) => {
                  setActiveGroupId(e.target.value);
                  setCurrentTab('groups');
                }}
                className="text-xs font-bold py-1 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 max-w-[140px] truncate"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.emoji} {g.name}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <Avatar name={user.name} avatarUrl={user.avatar} size="xs" />
          </div>
        </header>

        {/* Dynamic View Router */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              onOpenAddExpense={handleOpenAddExpense}
              onOpenSettleUp={handleOpenSettleUp}
              onSelectGroup={(groupId) => {
                setActiveGroupId(groupId);
                setCurrentTab('groups');
              }}
              onCreateGroup={() => setIsCreateGroupOpen(true)}
            />
          )}

          {currentTab === 'groups' && (
            <GroupDetailView
              onOpenAddExpense={handleOpenAddExpense}
              onOpenSettleUp={handleOpenSettleUp}
              onSelectExpense={handleSelectExpense}
              onCreateGroup={() => setIsCreateGroupOpen(true)}
            />
          )}

          {currentTab === 'friends' && (
            <FriendsView
              onOpenSettleUp={handleOpenSettleUp}
              onOpenAddExpense={handleOpenAddExpense}
            />
          )}

          {currentTab === 'activity' && <ActivityView />}

          {currentTab === 'insights' && <InsightsView />}

          {currentTab === 'settings' && (
            <SettingsView isDark={isDark} onToggleTheme={toggleTheme} />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAddExpense={handleOpenAddExpense}
      />

      {/* Modals */}
      <OnboardingModal />

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setEditingExpense(null);
        }}
        editExpense={editingExpense}
      />

      <ExpenseDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedExpense(null);
        }}
        expense={selectedExpense}
        onEdit={handleEditExpense}
      />

      <SettleUpModal
        isOpen={isSettleUpOpen}
        onClose={() => {
          setIsSettleUpOpen(false);
          setSettleDebt(undefined);
        }}
        defaultPayerId={settleDebt?.from}
        defaultRecipientId={settleDebt?.to}
        defaultAmount={settleDebt?.amount}
      />

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <GroupProvider>
        <MainAppContent />
      </GroupProvider>
    </AuthProvider>
  );
}
