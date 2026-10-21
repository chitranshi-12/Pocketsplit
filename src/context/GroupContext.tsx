import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { useAuth } from './AuthContext';
import { 
  Activity, 
  Comment, 
  Debt, 
  Expense, 
  Group, 
  Member, 
  MemberBalance, 
  Settlement, 
  UserProfile 
} from '../types';
import { 
  calculateMemberBalances, 
  calculateRawDebts, 
  simplifyDebts 
} from '../services/debtSimplification';
import { 
  DEMO_ACTIVITIES, 
  DEMO_EXPENSES, 
  DEMO_GROUPS, 
  DEMO_SETTLEMENTS 
} from '../data/demoData';

interface GroupContextType {
  groups: Group[];
  activeGroup: Group | null;
  activeGroupId: string | null;
  setActiveGroupId: (id: string | null) => void;
  expenses: Expense[];
  settlements: Settlement[];
  activities: Activity[];
  comments: Comment[];
  memberBalances: Record<string, MemberBalance>;
  debts: Debt[];
  rawDebts: Debt[];
  totalYouOwe: number;
  totalYouAreOwed: number;
  netGlobalBalance: number;
  loading: boolean;
  createGroup: (name: string, type: Group['type'], emoji: string, color: string, inviteEmails: string[]) => Promise<string>;
  updateGroup: (groupId: string, updates: Partial<Group>) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'createdBy'>) => Promise<void>;
  updateExpense: (expenseId: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  addSettlement: (settlement: Omit<Settlement, 'id' | 'createdAt' | 'createdBy'>) => Promise<void>;
  addComment: (expenseId: string, text: string) => Promise<void>;
  toggleSimplifyDebts: (groupId: string) => Promise<void>;
  inviteMember: (groupId: string, email: string, name?: string) => Promise<void>;
  joinGroupByCode: (code: string) => Promise<boolean>;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export const GroupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isDemoUser } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper for localStorage storage per user
  const getUserKey = (key: string) => `pocketsplit_${user?.id || 'anon'}_${key}`;

  const getStoredData = <T,>(key: string, defaultVal: T): T => {
    try {
      const raw = localStorage.getItem(getUserKey(key));
      return raw ? JSON.parse(raw) : defaultVal;
    } catch {
      return defaultVal;
    }
  };

  const setStoredData = <T,>(key: string, val: T) => {
    try {
      localStorage.setItem(getUserKey(key), JSON.stringify(val));
    } catch (e) {
      console.warn('localStorage setItem failed:', e);
    }
  };

  // Helper to build a starter group for a brand new user
  const createStarterGroup = (currentUser: UserProfile): Group => {
    return {
      id: `group_starter_${Date.now()}`,
      name: 'Friends & Flatmates 🏖️',
      type: 'Trip',
      emoji: '🏖️',
      color: 'emerald',
      createdBy: currentUser.id,
      memberIds: [currentUser.id, 'mem_rahul', 'mem_ananya'],
      members: [
        { id: currentUser.id, name: `${currentUser.name} (You)`, email: currentUser.email, upiId: currentUser.upiId },
        { id: 'mem_rahul', name: 'Rahul Sharma', email: 'rahul@example.com', upiId: 'rahul@upi' },
        { id: 'mem_ananya', name: 'Ananya Iyer', email: 'ananya@example.com', upiId: 'ananya@upi' },
      ],
      simplifyDebts: true,
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdAt: new Date().toISOString(),
    };
  };

  // 1. Load Groups
  useEffect(() => {
    if (!user) {
      setGroups([]);
      setActiveGroupId(null);
      setLoading(false);
      return;
    }

    if (isDemoUser) {
      const demoGroups = getStoredData<Group[]>('groups', DEMO_GROUPS);
      setGroups(demoGroups);
      if (demoGroups.length > 0) {
        setActiveGroupId(demoGroups[0].id);
      }
      setLoading(false);
      return;
    }

    // Real Firebase listener
    try {
      const groupsRef = collection(db, 'groups');
      const q = query(groupsRef, where('memberIds', 'array-contains', user.id));

      const unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          const loadedGroups: Group[] = [];
          snapshot.forEach((docSnap) => {
            loadedGroups.push({ id: docSnap.id, ...docSnap.data() } as Group);
          });

          if (loadedGroups.length === 0) {
            // New user has 0 groups: create a starter group immediately!
            const starter = createStarterGroup(user);
            try {
              await setDoc(doc(db, 'groups', starter.id), starter);
              loadedGroups.push(starter);
            } catch (err) {
              console.warn('Could not write starter group to Firestore, using local fallback:', err);
              loadedGroups.push(starter);
            }
          }

          setGroups(loadedGroups);
          setActiveGroupId((prev) => prev || loadedGroups[0]?.id || null);
          setLoading(false);
        },
        (error) => {
          console.warn('Firestore groups onSnapshot warning:', error);
          // Fallback to local storage
          const fallbackGroups = getStoredData<Group[]>('groups', [createStarterGroup(user)]);
          setGroups(fallbackGroups);
          setActiveGroupId(fallbackGroups[0]?.id || null);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.warn('Error setting up groups listener, using fallback:', e);
      const fallbackGroups = getStoredData<Group[]>('groups', [createStarterGroup(user)]);
      setGroups(fallbackGroups);
      setActiveGroupId(fallbackGroups[0]?.id || null);
      setLoading(false);
    }
  }, [user?.id, isDemoUser]);

  const activeGroup = useMemo(() => {
    return groups.find((g) => g.id === activeGroupId) || groups[0] || null;
  }, [groups, activeGroupId]);

  // 2. Load Expenses, Settlements, Activities for Active Group
  useEffect(() => {
    if (!user || !activeGroup) {
      setExpenses([]);
      setSettlements([]);
      setActivities([]);
      setComments([]);
      return;
    }

    if (isDemoUser) {
      const allExpenses = getStoredData<Record<string, Expense[]>>('expenses', DEMO_EXPENSES);
      const allSettlements = getStoredData<Record<string, Settlement[]>>('settlements', DEMO_SETTLEMENTS);
      const allActivities = getStoredData<Activity[]>('activities', DEMO_ACTIVITIES);

      setExpenses(allExpenses[activeGroup.id] || []);
      setSettlements(allSettlements[activeGroup.id] || []);
      setActivities(allActivities);
      return;
    }

    try {
      const expensesPath = `groups/${activeGroup.id}/expenses`;
      const expQ = query(collection(db, expensesPath), orderBy('date', 'desc'));
      const unsubExp = onSnapshot(
        expQ,
        (snap) => {
          const items: Expense[] = [];
          snap.forEach((d) => items.push({ id: d.id, ...d.data() } as Expense));
          setExpenses(items);
        },
        (err) => {
          console.warn('Expenses listener warning, reading fallback:', err);
          const allExpenses = getStoredData<Record<string, Expense[]>>('expenses', DEMO_EXPENSES);
          setExpenses(allExpenses[activeGroup.id] || []);
        }
      );

      const settlementsPath = `groups/${activeGroup.id}/settlements`;
      const setQ = query(collection(db, settlementsPath), orderBy('date', 'desc'));
      const unsubSet = onSnapshot(
        setQ,
        (snap) => {
          const items: Settlement[] = [];
          snap.forEach((d) => items.push({ id: d.id, ...d.data() } as Settlement));
          setSettlements(items);
        },
        (err) => {
          console.warn('Settlements listener warning:', err);
        }
      );

      const activitiesPath = `groups/${activeGroup.id}/activities`;
      const actQ = query(collection(db, activitiesPath), orderBy('timestamp', 'desc'));
      const unsubAct = onSnapshot(
        actQ,
        (snap) => {
          const items: Activity[] = [];
          snap.forEach((d) => items.push({ id: d.id, ...d.data() } as Activity));
          setActivities(items);
        },
        (err) => {
          console.warn('Activities listener warning:', err);
        }
      );

      return () => {
        unsubExp();
        unsubSet();
        unsubAct();
      };
    } catch (e) {
      console.warn('Error attaching subcollection listeners:', e);
      const allExpenses = getStoredData<Record<string, Expense[]>>('expenses', DEMO_EXPENSES);
      setExpenses(allExpenses[activeGroup.id] || []);
    }
  }, [activeGroup?.id, user?.id, isDemoUser]);

  // 3. Compute balances & debts for Active Group
  const memberBalances = useMemo(() => {
    if (!activeGroup) return {};
    return calculateMemberBalances(activeGroup.members, expenses, settlements);
  }, [activeGroup, expenses, settlements]);

  const rawDebts = useMemo(() => {
    if (!activeGroup) return [];
    return calculateRawDebts(expenses, settlements, user?.currency || 'INR');
  }, [activeGroup, expenses, settlements, user?.currency]);

  const debts = useMemo(() => {
    if (!activeGroup) return [];
    if (activeGroup.simplifyDebts) {
      return simplifyDebts(memberBalances, user?.currency || 'INR');
    }
    return rawDebts;
  }, [activeGroup, memberBalances, rawDebts, user?.currency]);

  // 4. Global balance totals
  const { totalYouOwe, totalYouAreOwed, netGlobalBalance } = useMemo(() => {
    if (!user) return { totalYouOwe: 0, totalYouAreOwed: 0, netGlobalBalance: 0 };

    let youOwe = 0;
    let youAreOwed = 0;
    const myBalance = memberBalances[user.id]?.netBalance || 0;

    if (myBalance > 0) {
      youAreOwed = myBalance;
    } else {
      youOwe = Math.abs(myBalance);
    }

    return {
      totalYouOwe: youOwe,
      totalYouAreOwed: youAreOwed,
      netGlobalBalance: myBalance,
    };
  }, [user, memberBalances]);

  // Operations
  const createGroup = async (
    name: string,
    type: Group['type'],
    emoji: string,
    color: string,
    inviteEmails: string[]
  ): Promise<string> => {
    if (!user) throw new Error('Not logged in');

    const newMembers: Member[] = [
      { id: user.id, name: user.name, email: user.email, upiId: user.upiId },
      ...inviteEmails.map((email, idx) => ({
        id: `member_${Date.now()}_${idx}`,
        name: email.split('@')[0],
        email,
      })),
    ];

    const newGroupId = `group_${Date.now()}`;
    const newGroup: Group = {
      id: newGroupId,
      name,
      type,
      emoji: emoji || '👥',
      color: color || 'emerald',
      createdBy: user.id,
      memberIds: newMembers.map((m) => m.id),
      members: newMembers,
      simplifyDebts: true,
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdAt: new Date().toISOString(),
    };

    // Always update local state immediately for instant responsive UI
    const updated = [newGroup, ...groups];
    setGroups(updated);
    setStoredData('groups', updated);
    setActiveGroupId(newGroup.id);

    // Sync with Firestore if online
    if (!isDemoUser) {
      try {
        await setDoc(doc(db, 'groups', newGroup.id), newGroup);
      } catch (err) {
        console.warn('Could not persist group to Firestore:', err);
      }
    }

    return newGroup.id;
  };

  const updateGroup = async (groupId: string, updates: Partial<Group>) => {
    const updated = groups.map((g) => (g.id === groupId ? { ...g, ...updates } : g));
    setGroups(updated);
    setStoredData('groups', updated);

    if (!isDemoUser) {
      try {
        await updateDoc(doc(db, 'groups', groupId), updates);
      } catch (err) {
        console.warn('Could not update group in Firestore:', err);
      }
    }
  };

  const addExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'createdBy'>) => {
    if (!user) throw new Error('Not logged in');
    
    // Auto-create a group if none exists yet!
    let targetGroup = activeGroup;
    if (!targetGroup) {
      const starter = createStarterGroup(user);
      await createGroup(starter.name, starter.type, starter.emoji, starter.color, []);
      targetGroup = starter;
    }

    const newExpense: Expense = {
      ...expenseData,
      id: `exp_${Date.now()}`,
      groupId: targetGroup.id,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
    };

    const newActivity: Activity = {
      id: `act_${Date.now()}`,
      groupId: targetGroup.id,
      groupName: targetGroup.name,
      userId: user.id,
      userName: user.name,
      type: 'expense_added',
      message: `added "${newExpense.description}" for ${newExpense.currency} ${newExpense.amount.toLocaleString()}`,
      timestamp: new Date().toISOString(),
      amount: newExpense.amount,
      currency: newExpense.currency,
    };

    // Immediate local update
    const allExpenses = getStoredData<Record<string, Expense[]>>('expenses', DEMO_EXPENSES);
    const groupExps = [newExpense, ...(allExpenses[targetGroup.id] || expenses)];
    allExpenses[targetGroup.id] = groupExps;
    setStoredData('expenses', allExpenses);
    setExpenses(groupExps);

    const allActs = [newActivity, ...activities];
    setActivities(allActs);
    setStoredData('activities', allActs);

    // Sync to Firestore
    if (!isDemoUser) {
      try {
        const path = `groups/${targetGroup.id}/expenses`;
        await setDoc(doc(db, path, newExpense.id), newExpense);
        await setDoc(doc(db, `groups/${targetGroup.id}/activities`, newActivity.id), newActivity);
      } catch (err) {
        console.warn('Could not save expense to Firestore, kept locally:', err);
      }
    }
  };

  const updateExpense = async (expenseId: string, updates: Partial<Expense>) => {
    if (!user || !activeGroup) return;

    const groupExps = expenses.map((e) =>
      e.id === expenseId ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
    );
    setExpenses(groupExps);
    const allExpenses = getStoredData<Record<string, Expense[]>>('expenses', DEMO_EXPENSES);
    allExpenses[activeGroup.id] = groupExps;
    setStoredData('expenses', allExpenses);

    if (!isDemoUser) {
      try {
        const path = `groups/${activeGroup.id}/expenses/${expenseId}`;
        await updateDoc(doc(db, path), { ...updates, updatedAt: new Date().toISOString() });
      } catch (err) {
        console.warn('Could not update expense in Firestore:', err);
      }
    }
  };

  const deleteExpense = async (expenseId: string) => {
    if (!user || !activeGroup) return;

    const groupExps = expenses.filter((e) => e.id !== expenseId);
    setExpenses(groupExps);
    const allExpenses = getStoredData<Record<string, Expense[]>>('expenses', DEMO_EXPENSES);
    allExpenses[activeGroup.id] = groupExps;
    setStoredData('expenses', allExpenses);

    if (!isDemoUser) {
      try {
        const path = `groups/${activeGroup.id}/expenses/${expenseId}`;
        await deleteDoc(doc(db, path));
      } catch (err) {
        console.warn('Could not delete expense from Firestore:', err);
      }
    }
  };

  const addSettlement = async (settlementData: Omit<Settlement, 'id' | 'createdAt' | 'createdBy'>) => {
    if (!user || !activeGroup) throw new Error('No active group');

    const fromMember = activeGroup.members.find((m) => m.id === settlementData.fromMemberId);
    const toMember = activeGroup.members.find((m) => m.id === settlementData.toMemberId);

    const newSettlement: Settlement = {
      ...settlementData,
      id: `set_${Date.now()}`,
      groupId: activeGroup.id,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
    };

    const newActivity: Activity = {
      id: `act_${Date.now()}`,
      groupId: activeGroup.id,
      groupName: activeGroup.name,
      userId: user.id,
      userName: user.name,
      type: 'settlement_added',
      message: `${fromMember?.name || 'Someone'} paid ${toMember?.name || 'someone'} ${newSettlement.currency} ${newSettlement.amount.toLocaleString()} via ${newSettlement.paymentMethod.toUpperCase()}`,
      timestamp: new Date().toISOString(),
      amount: newSettlement.amount,
      currency: newSettlement.currency,
    };

    // Immediate local update
    const allSets = getStoredData<Record<string, Settlement[]>>('settlements', DEMO_SETTLEMENTS);
    const groupSets = [newSettlement, ...(allSets[activeGroup.id] || settlements)];
    allSets[activeGroup.id] = groupSets;
    setStoredData('settlements', allSets);
    setSettlements(groupSets);

    const allActs = [newActivity, ...activities];
    setActivities(allActs);
    setStoredData('activities', allActs);

    if (!isDemoUser) {
      try {
        const path = `groups/${activeGroup.id}/settlements`;
        await setDoc(doc(db, path, newSettlement.id), newSettlement);
        await setDoc(doc(db, `groups/${activeGroup.id}/activities`, newActivity.id), newActivity);
      } catch (err) {
        console.warn('Could not save settlement to Firestore, saved locally:', err);
      }
    }
  };

  const addComment = async (expenseId: string, text: string) => {
    if (!user || !activeGroup) return;

    const newComment: Comment = {
      id: `comm_${Date.now()}`,
      groupId: activeGroup.id,
      expenseId,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      text,
      createdAt: new Date().toISOString(),
    };

    setComments((prev) => [...prev, newComment]);

    if (!isDemoUser) {
      try {
        const path = `groups/${activeGroup.id}/comments`;
        await setDoc(doc(db, path, newComment.id), newComment);
      } catch (err) {
        console.warn('Could not save comment to Firestore:', err);
      }
    }
  };

  const toggleSimplifyDebts = async (groupId: string) => {
    const target = groups.find((g) => g.id === groupId);
    if (!target) return;
    const newVal = !target.simplifyDebts;
    await updateGroup(groupId, { simplifyDebts: newVal });
  };

  const inviteMember = async (groupId: string, email: string, name?: string) => {
    const target = groups.find((g) => g.id === groupId);
    if (!target) return;

    const newMember: Member = {
      id: `member_${Date.now()}`,
      name: name || email.split('@')[0],
      email,
    };

    const updatedMembers = [...target.members, newMember];
    const updatedMemberIds = [...target.memberIds, newMember.id];

    await updateGroup(groupId, {
      members: updatedMembers,
      memberIds: updatedMemberIds,
    });
  };

  const joinGroupByCode = async (code: string): Promise<boolean> => {
    if (!user) return false;
    const target = groups.find((g) => g.inviteCode?.toUpperCase() === code.trim().toUpperCase());
    if (target) {
      if (!target.memberIds.includes(user.id)) {
        await inviteMember(target.id, user.email, user.name);
      }
      setActiveGroupId(target.id);
      return true;
    }
    return false;
  };

  return (
    <GroupContext.Provider
      value={{
        groups,
        activeGroup,
        activeGroupId,
        setActiveGroupId,
        expenses,
        settlements,
        activities,
        comments,
        memberBalances,
        debts,
        rawDebts,
        totalYouOwe,
        totalYouAreOwed,
        netGlobalBalance,
        loading,
        createGroup,
        updateGroup,
        addExpense,
        updateExpense,
        deleteExpense,
        addSettlement,
        addComment,
        toggleSimplifyDebts,
        inviteMember,
        joinGroupByCode,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
};

export const useGroups = () => {
  const context = useContext(GroupContext);
  if (!context) throw new Error('useGroups must be used within a GroupProvider');
  return context;
};
