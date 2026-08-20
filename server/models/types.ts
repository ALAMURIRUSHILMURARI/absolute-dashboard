export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD';

export type RelationshipCategory = 'Friend' | 'Colleague' | 'Family' | 'Roommate' | 'Client' | 'Other';

export type TransactionDirection = 'THEY_OWE_ME' | 'I_OWE_THEM';

export type TransactionType = 'Expense' | 'Loan' | 'Borrowed' | 'Reimbursement' | 'Payment' | 'Other';

export type PaymentMethod = 'Cash' | 'UPI' | 'Bank Transfer' | 'Card' | 'Other';

export type DailyPaymentMethod = 'UPI' | 'Cash';

export type DailyPaymentFlow = 'OUTGOING' | 'INCOMING';

export type DailyPaymentCategory =
  | 'Food & Dining'
  | 'Travel & Fuel'
  | 'Groceries'
  | 'Shopping'
  | 'Bills & Utilities'
  | 'Entertainment'
  | 'Income & Salary'
  | 'Freelance'
  | 'Refund & Cashback'
  | 'Personal Care'
  | 'Other';

export type TransactionStatus = 'Pending' | 'Partial' | 'Settled' | 'Overdue';

export type ScheduleCategory = 'Personal' | 'College' | 'Work' | 'Interview' | 'Exam' | 'Meeting' | 'Other';

export type SchedulePriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type ScheduleRecurrence = 'None' | 'Daily' | 'Weekly' | 'Monthly' | 'Custom';

export type ReminderType = 'Payment' | 'Schedule' | 'Exam' | 'Meeting' | 'Personal';

export type NotificationType = 'PAYMENT_DUE' | 'PAYMENT_OVERDUE' | 'SCHEDULE_TODAY' | 'REMINDER' | 'SETTLEMENT' | 'SYSTEM';

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  currency: CurrencyCode;
  soundEnabled: boolean;
  dueAlertsDaysBefore: number;
  emailNotifications: boolean;
  alertEmail?: string; // Target email for 30-min schedule alert emails (e.g. mail4murari27@gmail.com)
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface Person {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  email?: string;
  avatar?: string;
  relationship: RelationshipCategory;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  personId: string;
  amount: number;
  direction: TransactionDirection;
  type: TransactionType;
  description: string;
  date: string;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  dueDate?: string;
  notes?: string;
  originalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  isSettlement?: boolean;
  settlementForId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyPayment {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  paymentMethod: DailyPaymentMethod;
  flow: DailyPaymentFlow;
  date: string;
  time?: string;
  category?: DailyPaymentCategory;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  id: string;
  userId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  description?: string;
  priority: SchedulePriority;
  category: ScheduleCategory;
  reminder: string;
  recurring: ScheduleRecurrence;
  isCompleted: boolean;
  completedAt?: string;
  emailAlertSent?: boolean;
  emailAlertSentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  date: string;
  time: string;
  type: ReminderType;
  priority: SchedulePriority;
  relatedPersonId?: string;
  relatedScheduleId?: string;
  amount?: number;
  isCompleted: boolean;
  completedAt?: string;
  isSnoozed?: boolean;
  snoozedUntil?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface PersonBalanceSummary {
  person: Person;
  youOwe: number;
  theyOweYou: number;
  netBalance: number;
  pendingCount: number;
  totalTransactionsCount: number;
  lastTransactionDate?: string;
}

export interface FinancialOverviewSummary {
  totalYouOwe: number;
  totalOthersOweYou: number;
  netBalance: number;
  dueTodayAmount: number;
  overdueAmount: number;
  activeTabsCount: number;
  totalTransactionsCount: number;
  pendingDuesCount: number;
}

export interface DueItem {
  transaction: Transaction;
  personName: string;
  personAvatar?: string;
  personRelationship: string;
  dueStatus: 'Overdue' | 'Due Today' | 'Due Soon' | 'Settled' | 'No Due Date';
  daysDifference: number;
}
