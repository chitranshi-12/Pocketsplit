export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'SGD' | 'AED' | 'JPY';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', locale: 'en-CA' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG' },
  AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', locale: 'ar-AE' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
};

export type GroupType = 'Trip' | 'Home' | 'Couple' | 'Other';

export interface Member {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  upiId?: string;
}

export interface Group {
  id: string;
  name: string;
  type: GroupType;
  emoji: string;
  color: string;
  createdBy: string;
  memberIds: string[];
  members: Member[];
  simplifyDebts: boolean;
  inviteCode?: string;
  createdAt: string;
  updatedAt?: string;
}

export type SplitType = 'equal' | 'exact' | 'percentage' | 'shares' | 'adjustment';

export type ExpenseCategory = 
  | 'Food & Drink'
  | 'Groceries'
  | 'Transportation'
  | 'Rent & Housing'
  | 'Utilities'
  | 'Entertainment'
  | 'Shopping'
  | 'Travel & Flight'
  | 'Health'
  | 'General';

export interface Payer {
  memberId: string;
  amount: number; // in floating or paise units
}

export interface SplitDetail {
  memberId: string;
  amount: number; // calculated share in standard currency units
  share?: number; // for 'shares' split
  percentage?: number; // for 'percentage' split
  adjustment?: number; // for 'adjustment' split
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  currency: CurrencyCode;
  category: ExpenseCategory;
  date: string; // YYYY-MM-DD
  paidBy: Payer[];
  splitType: SplitType;
  splitDetails: SplitDetail[];
  participantIds: string[];
  notes?: string;
  receiptUrl?: string;
  recurring?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Settlement {
  id: string;
  groupId: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  currency: CurrencyCode;
  date: string;
  paymentMethod: 'upi' | 'cash' | 'bank_transfer' | 'card' | 'other';
  reference?: string;
  receiptUrl?: string;
  createdBy: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  groupId: string;
  groupName?: string;
  userId: string;
  userName: string;
  type: 'expense_added' | 'expense_updated' | 'expense_deleted' | 'settlement_added' | 'group_created' | 'member_joined';
  message: string;
  timestamp: string;
  amount?: number;
  currency?: CurrencyCode;
}

export interface Comment {
  id: string;
  groupId: string;
  expenseId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  currency: CurrencyCode;
  upiId?: string;
  createdAt: string;
}

export interface Debt {
  from: string; // debtor memberId
  to: string;   // creditor memberId
  amount: number;
  currency: CurrencyCode;
}

export interface MemberBalance {
  memberId: string;
  memberName: string;
  netBalance: number; // positive = owed money, negative = owes money
  totalPaid: number;
  totalShare: number;
}
