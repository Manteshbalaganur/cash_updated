// ============================================================
// MOCK DATA - Replace these with real API calls or DB queries
// ============================================================

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: "income" | "expense";
  wallet: string;
}

export interface WalletData {
  id: string;
  name: string;
  description: string;
  balance: number;
  status: string;
  color: string;
  actions: string[];
}

export interface MonthlyChartData {
  month: string;
  income: number;
  expense: number;
}

export interface CategoryExpense {
  name: string;
  value: number;
  color: string;
  percentage: string;
}

export interface StatCard {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative";
  icon: string;
  iconBg: string;
}

// --- Normal User Stats ---
export const normalUserStats: StatCard[] = [
  {
    label: "Total Balance",
    value: "$45,230.5",
    change: "+5.2%",
    changeType: "positive",
    icon: "dollar",
    iconBg: "bg-blue-500",
  },
  {
    label: "Monthly Income",
    value: "$8,500",
    change: "Steady income stream",
    icon: "trending-up",
    iconBg: "bg-green-500",
  },
  {
    label: "Monthly Expenses",
    value: "$5,420.3",
    change: "-2.1%",
    changeType: "negative",
    icon: "expense",
    iconBg: "bg-red-500",
  },
  {
    label: "Savings Rate",
    value: "36.2%",
    change: "Above average!",
    changeType: "positive",
    icon: "savings",
    iconBg: "bg-orange-500",
  },
];

// --- Super User Stats ---
export const superUserStats: StatCard[] = [
  {
    label: "Net Worth",
    value: "$285,400",
    change: "Liabilities",
    icon: "net-worth",
    iconBg: "bg-blue-600",
  },
  {
    label: "Total Assets",
    value: "$325,400",
    change: "+5% this quarter",
    changeType: "positive",
    icon: "assets",
    iconBg: "bg-green-600",
  },
  {
    label: "Total Liabilities",
    value: "$40,000",
    change: "-8.3% this quarter",
    changeType: "negative",
    icon: "liabilities",
    iconBg: "bg-red-500",
  },
  {
    label: "Financial Health Score",
    value: "8.4",
    change: "Excellent",
    changeType: "positive",
    icon: "health",
    iconBg: "bg-green-500",
  },
];

// --- Monthly Chart Data ---
export const monthlyChartData: MonthlyChartData[] = [
  { month: "Aug", income: 7200, expense: 4800 },
  { month: "Sep", income: 8100, expense: 5200 },
  { month: "Oct", income: 7800, expense: 5600 },
  { month: "Nov", income: 8500, expense: 5100 },
  { month: "Dec", income: 9200, expense: 6300 },
  { month: "Jan", income: 8500, expense: 5420 },
];

// --- Category Expenses ---
export const categoryExpenses: CategoryExpense[] = [
  { name: "Housing", value: 1800, color: "#4F46E5", percentage: "33.2%" },
  { name: "Food", value: 950, color: "#8B5CF6", percentage: "17.5%" },
  { name: "Transport", value: 520, color: "#EC4899", percentage: "9.6%" },
  { name: "Entertainment", value: 380, color: "#F59E0B", percentage: "7.0%" },
  { name: "Utilities", value: 450, color: "#10B981", percentage: "8.3%" },
];

// --- Wallets ---
export const wallets: WalletData[] = [
  {
    id: "normal",
    name: "Normal Wallet",
    description: "Active balance for daily spending",
    balance: 25430.5,
    status: "Active",
    color: "blue",
    actions: ["View Transactions"],
  },
  {
    id: "emergency",
    name: "Emergency Fund",
    description: "Locked savings balance",
    balance: 15000,
    status: "Protected",
    color: "purple",
    actions: ["Transfer to Normal Wallet"],
  },
  {
    id: "cashback",
    name: "Cashback Wallet",
    description: "Auto-invested by default",
    balance: 4800,
    status: "Auto-Invest",
    color: "green",
    actions: ["Withdraw to Bank", "Spend on Purchase"],
  },
];

// --- Transactions ---
export const recentTransactions: Transaction[] = [
  { id: "1", date: "2026-02-04", description: "Grocery Store", category: "Food", amount: -125, type: "expense", wallet: "Normal Wallet" },
  { id: "2", date: "2026-02-03", description: "Salary Deposit", category: "Income", amount: 8500, type: "income", wallet: "Normal Wallet" },
  { id: "3", date: "2026-02-02", description: "Electric Bill", category: "Utilities", amount: -89, type: "expense", wallet: "Normal Wallet" },
  { id: "4", date: "2026-02-01", description: "Uber Ride", category: "Transport", amount: -24.5, type: "expense", wallet: "Normal Wallet" },
  { id: "5", date: "2026-01-31", description: "Amazon Purchase", category: "Shopping", amount: -156, type: "expense", wallet: "Normal Wallet" },
  { id: "6", date: "2026-01-30", description: "Freelance Payment", category: "Income", amount: 1200, type: "income", wallet: "Normal Wallet" },
  { id: "7", date: "2026-01-29", description: "Netflix", category: "Entertainment", amount: -15.99, type: "expense", wallet: "Normal Wallet" },
  { id: "8", date: "2026-01-28", description: "Restaurant", category: "Food", amount: -67, type: "expense", wallet: "Normal Wallet" },
];

// --- Asset vs Liability Trend (Super User) ---
export const assetLiabilityTrend = [
  { month: "Aug", assets: 290000, liabilities: 45000 },
  { month: "Sep", assets: 298000, liabilities: 44000 },
  { month: "Oct", assets: 305000, liabilities: 43000 },
  { month: "Nov", assets: 310000, liabilities: 42500 },
  { month: "Dec", assets: 318000, liabilities: 41000 },
  { month: "Jan", assets: 325400, liabilities: 40000 },
];

// --- Asset Distribution (Super User) ---
export const assetDistribution = [
  { name: "Real Estate", value: 180000, color: "#4F46E5" },
  { name: "Stocks & Equity", value: 85000, color: "#10B981" },
  { name: "Cash & Savings", value: 45400, color: "#F59E0B" },
  { name: "Gold & Commodities", value: 15000, color: "#6B7280" },
];

// --- Liabilities Breakdown (Super User) ---
export const liabilitiesBreakdown = [
  { name: "Home Loan", amount: 32000, percentage: 80 },
  { name: "Car Loan", amount: 6500, percentage: 16.25 },
  { name: "Credit Card", amount: 1500, percentage: 3.75 },
];

// --- Investment Allocation (Super User) ---
export const investmentAllocation = [
  { name: "Equity", value: 45, color: "#4F46E5" },
  { name: "Debt", value: 30, color: "#10B981" },
  { name: "Gold", value: 10, color: "#F59E0B" },
  { name: "Cash", value: 15, color: "#6B7280" },
];

// --- Investment Instruments ---
export const investmentInstruments = [
  { name: "Large Cap Equity Funds", description: "Stable growth with moderate risk", allocation: "25%", recommended: true },
  { name: "Government Bonds", description: "Low risk, steady returns", allocation: "20%", recommended: true },
  { name: "Mid Cap Funds", description: "Higher growth potential", allocation: "15%", recommended: true },
  { name: "Gold ETF", description: "Hedge against inflation", allocation: "10%", recommended: true },
];

// --- Financial Health Scores ---
export const financialHealthScores = [
  { label: "Liquidity", score: 9.2 },
  { label: "Debt Management", score: 8.5 },
  { label: "Investment Growth", score: 7.8 },
  { label: "Savings Rate", score: 8.0 },
];

// --- AI Chat Suggestions ---
export const normalChatSuggestions = [
  "Where am I overspending?",
  "How can I save more?",
  "Which investment suits me and why?",
  "What's my financial health score?",
  "Should I increase my emergency fund?",
];

// --- AI Insights ---
export const aiInsights = {
  observation: "Your shopping expenses are 15% higher than your 6-month average. Consider setting a monthly budget cap to increase your savings rate.",
  recommendation: "You're on track to reach your emergency fund goal in 35 months. Transferring your next bonus could accelerate this to just 24 months.",
};
