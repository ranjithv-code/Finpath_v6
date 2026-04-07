export interface Loan {
  id: string;
  type: string;
  amount: number;
  emi: number;
}

export interface InvestmentOption {
  method: string;
  expectedReturn: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY LOW' | 'MEDIUM-HIGH';
  bestFor: string;
  monthlyAmount?: number;
}

export interface GoalPlan {
  type: 'Safe' | 'Balanced' | 'Fast-track';
  targetAmount: number;
  years: number;
  monthlySIP: number;
  oneTimeAmount: number;
  assetAllocation: string;
  riskNote: string;
  milestoneSummary: string;
  feasibilityStatus: 'High' | 'Moderate' | 'Low' | 'Stretched';
  expectedReturn?: number;
}

export interface GoalInterviewAnswer {
  questionId: string;
  answer: any;
}

export interface Goal {
  id: string;
  name: string;
  category: string;
  target: number;
  current: number;
  timeline: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  color: string;
  status?: 'ACTIVE' | 'DELETED' | 'COMPLETED';
  deletedAt?: string;
  deleteReason?: string;
  deleteNote?: string;
  selectedInvestment?: InvestmentOption;
  todayPrice?: number;
  inflationRate?: number;
  futureCost?: number;
  answers?: GoalInterviewAnswer[];
  selectedPlan?: GoalPlan;
  firstNextAction?: string;
  reasonForPriority?: string;
}

export interface FamilyProfile {
  householdType: 'Single' | 'Nuclear Family' | 'Joint Family';
  spouseStatus: 'Working' | 'Home Maker' | 'Not Applicable';
  dependentsCount: number;
  earningMembersCount: number;
  householdMonthlyIncome: number;
  householdMonthlyExpenses: number;
  majorAssets: string[];
  majorLiabilities: string[];
  emergencyFundMonths: number;
  keyFamilyGoals: string[];
}

export interface SupportTicket {
  id: string;
  category: string;
  title: string;
  description: string;
  email: string;
  status: 'Submitted' | 'In Progress' | 'Resolved';
  createdAt: string;
  attachment?: string;
}

export interface VerificationItem {
  id: string;
  title: string;
  description: string;
  status: 'VERIFIED' | 'PENDING';
  demoData?: any;
}

export interface SplitMember {
  id: string;
  name: string;
  email?: string;
  isCurrentUser?: boolean;
  avatar?: string;
  inviteStatus?: 'owner' | 'invited' | 'active';
  isUser?: boolean;
}

export interface SplitExpense {
  id: string;
  description: string;
  amount: number;
  date: string;
  paidByMemberId: string;
  paidById?: string; // For Supabase
  splitType: 'EQUAL' | 'PERCENT' | 'AMOUNT' | 'SHARES';
  splits: { memberId: string; amount: number; percent?: number; shares?: number }[];
}

export interface SplitSettlement {
  id: string;
  groupId: string;
  payerId: string;
  receiverId: string;
  fromMemberId?: string; // For Supabase
  toMemberId?: string; // For Supabase
  amount: number;
  date: string;
  note?: string;
}

export interface ActivityLog {
  id: string;
  groupId: string;
  type: 'group_created' | 'member_invited' | 'expense_added' | 'expense_edited' | 'expense_deleted' | 'settlement_recorded';
  message: string;
  createdAt: string;
  meta?: any;
}

export interface SplitGroup {
  id: string;
  name: string;
  category?: string; // For Supabase
  totalBalance?: number; // For Supabase
  createdAt: string;
  members: SplitMember[];
  expenses: SplitExpense[];
  settlements: SplitSettlement[];
  activityLogs: ActivityLog[];
}

export interface MiniGoal {
  id: string;
  name: string;
  target: number;
  targetAmount?: number; // For Supabase
  current: number;
  currentAmount?: number; // For Supabase
  image: string;
  category: string;
  tips: string[];
  comparisons: { store: string; price: number }[];
  timelineMonths?: number;
  importance?: 'ESSENTIAL' | 'IMPORTANT' | 'NICE_TO_HAVE';
  status?: 'ACTIVE' | 'DELETED' | 'COMPLETED' | 'PAUSED';
  isArchived?: boolean; // For Supabase
  deletedAt?: string;
  deleteReason?: string;
  deleteNote?: string;
  fundingPlanChoice?: string;
  includedItems?: string[];
}

export interface InvestmentInstrument {
  id: string;
  type: string;
  name: string;
  startDate: string;
  contributionType: 'SIP' | 'Lumpsum' | 'Recurring' | 'Irregular';
  monthlyContribution: number;
  investedAmount: number;
  currentValue: number;
  note?: string;
  linkedGoals: { goalId: string; allocationPercent: number }[];
}

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  category: 'Rent' | 'Subscription' | 'EMI' | 'Utility' | 'Other';
  dueDate: number; // Day of month (1-31)
  isAutoDeduct: boolean;
  hasReminder: boolean;
}

export interface Referral {
  id: string;
  name: string;
  status: 'Joined' | 'Pending';
  amount: number;
  date: string;
}

export interface Achievement {
  id: string;
  title: string;
  icon: string;
  unlocked: boolean;
  description: string;
}

export interface UserProfile {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  city: string;
  income: number;
  expenses: number;
  loans: Loan[];
  goals: Goal[];
  onboarded: boolean;
  familyProfile?: FamilyProfile;
  verifications?: VerificationItem[];
  isLoggedIn: boolean;
  riskProfile?: 'LOW' | 'MEDIUM' | 'HIGH';
  persona?: string;
  financialHealthScore?: number;
  emergencyScore?: number;
  goalClarityScore?: number;
  savingsRatio?: number;
  emiBurden?: number;
  netWorth?: number;
  incomeStyles?: string[];
  incomeSources?: { name: string; amount: number; stability: string }[];
  earnerStructure?: string;
  incomeArrival?: string;
  lifestylePattern?: string;
  cashFlowPattern?: string;
  incomeStyle?: string;
  budgets?: { category: string; budget: number; actual: number }[];
  splitGroups?: SplitGroup[];
  miniGoals?: MiniGoal[];
  recurringExpenses?: RecurringExpense[];
  instruments?: InvestmentInstrument[];
  profilingData?: any;
  primaryGoal?: string;
  survivalMonths?: number;
  referrals?: Referral[];
  achievements?: Achievement[];
  supportTickets?: SupportTicket[];
}

export type Tab = 'home' | 'goals' | 'report' | 'learn' | 'profile' | 'welcome' | 'chat' | 'networth' | 'advisor' | 'onboarding' | 'sip-calculator' | 'split' | 'split-detail' | 'invite-friends' | 'smart-goal-questions' | 'smart-mini-goal-questions' | 'smart-goal-summary' | 'smart-mini-goal-report' | 'expense-breakdown' | 'save-together' | 'goal-detail' | 'smart-discovery' | 'goal-strategy' | 'mini-goal-detail' | 'universal-report' | 'goal-interview' | 'goal-estimation' | 'goal-feasibility' | 'goal-plans' | 'roadmap' | 'family-profiler' | 'help-support' | 'policies' | 'dos-donts' | 'active-goals-summary' | 'active-loans-summary' | 'learn-hub';

export const DEFAULT_USER: UserProfile = {
  name: 'Arjun',
  city: 'Chennai',
  income: 100000,
  expenses: 76000,
  loans: [],
  goals: [],
  primaryGoal: 'emergency',
  survivalMonths: 3.5,
  onboarded: false,
  isLoggedIn: false,
  budgets: [
    { category: 'Rent', budget: 20000, actual: 20000 },
    { category: 'Food', budget: 10000, actual: 12000 },
    { category: 'Transport', budget: 5000, actual: 4500 },
    { category: 'Entertainment', budget: 5000, actual: 7000 },
    { category: 'Utilities', budget: 4000, actual: 3800 },
  ],
  splitGroups: [],
  miniGoals: [],
  referrals: [],
  achievements: [
    { id: 'goal_starter', title: 'Goal Starter', icon: 'Target', unlocked: false, description: 'Created your first financial goal' },
    { id: 'wealth_builder', title: 'Wealth Builder', icon: 'TrendingUp', unlocked: false, description: 'Net worth crossed ₹10 Lakhs' },
    { id: 'credit_master', title: 'Credit Master', icon: 'ShieldCheck', unlocked: false, description: 'CIBIL score above 750' },
    { id: 'split_saver', title: 'Split Saver', icon: 'Users', unlocked: false, description: 'Created your first split group' }
  ],
  verifications: [
    { id: 'cibil', title: 'CIBIL CREDIT SCORE', description: 'Know your credit health. Lenders use this to approve loans.', status: 'PENDING', demoData: { score: 742, max: 900, rating: 'GOOD' } },
    { id: 'income', title: 'INCOME VERIFICATION', description: 'Verify your income via salary slip or bank statement upload', status: 'PENDING', demoData: { name: 'Arjun Sharma', amount: 100000, method: 'Bank Statement' } },
    { id: 'loans', title: 'LOAN & LIABILITY CHECK', description: 'See all your active loans in one place', status: 'PENDING', demoData: { activeLoans: [{ bank: 'HDFC', type: 'Car Loan', outstanding: 250000 }, { bank: 'IDFC', type: 'Personal Loan', outstanding: 250000 }] } },
    { id: 'bank', title: 'BANK ACCOUNT LINK', description: 'Link bank account to auto-fetch income and expense data', status: 'PENDING' },
    { id: 'pan', title: 'PAN CARD VERIFICATION', description: 'Verify PAN for tax compliance and investment KYC', status: 'PENDING' },
    { id: 'gst', title: 'GST / BUSINESS INCOME', description: 'If you run a business, verify GST turnover for accurate financial planning', status: 'PENDING' },
  ],
  recurringExpenses: []
};
