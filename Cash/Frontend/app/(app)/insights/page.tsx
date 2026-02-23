"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useUser } from "@/lib/user-context";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { RupeeIcon, TrendingUpIcon, ExpenseIcon, SavingsIcon } from "@/components/shared/stat-icons";
import { fetchWithAuth } from "@/lib/api-client";
import { toast } from "sonner";

const iconMap: Record<string, React.ReactNode> = {
  rupee: <RupeeIcon />,
  "trending-up": <TrendingUpIcon />,
  expense: <ExpenseIcon />,
  savings: <SavingsIcon />,
};

export default function InsightsPage() {
  const { userId, isLoaded } = useAuth();
  const { isSuper } = useUser();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  const loadInsightsData = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);

      // 1. Fetch Summary (Monthly)
      // Note: Backend /api/dashboard/monthly-summary returns { monthly_income, monthly_expenses, net_savings, savings_rate ... }
      const summaryData = await fetchWithAuth("/api/dashboard/monthly-summary/{userId}", userId, {}, isSuper);
      setSummary({
        income: summaryData.monthly_income,
        expense: summaryData.monthly_expenses,
        net: summaryData.net_savings,
        savings_rate: summaryData.savings_rate
      });

      // 2. Fetch AI Suggestions
      // Backend returns { wallets: {...}, suggestions: ["..."] }
      const aiData = await fetchWithAuth("/api/ai-suggestions/{userId}", userId, {}, isSuper);
      const suggestions = aiData.suggestions || [];
      setAiInsights({
        observation: suggestions[0] || "Your spending patterns are being analyzed.",
        recommendation: suggestions[1] || "Keep tracking your expenses to get better insights."
      });

      // 3. Fetch Recent Transactions
      const txData = await fetchWithAuth("/api/transactions/{userId}", userId, {}, isSuper);
      // Sort by date desc
      const sortedTx = (txData || []).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(sortedTx);

      // 4. Fetch Wallet balances for total balance
      const walletsData = await fetchWithAuth("/api/wallets/{userId}", userId, {}, isSuper);
      const totalBalance = (walletsData.normal || 0) + (walletsData.cashback || 0) + (walletsData.emergency || 0);

      // Set stats for the top cards
      setStats([
        {
          label: "Total Balance",
          value: `₹${totalBalance.toLocaleString()}`,
          icon: "rupee",
          iconBg: "bg-blue-500",
        },
        {
          label: "Monthly Income",
          value: `₹${(summaryData.monthly_income || 0).toLocaleString()}`,
          icon: "trending-up",
          iconBg: "bg-green-500",
        },
        {
          label: "Monthly Expenses",
          value: `₹${(summaryData.monthly_expenses || 0).toLocaleString()}`,
          icon: "expense",
          iconBg: "bg-red-500",
        },
        {
          label: "Savings Rate",
          value: `${summaryData.savings_rate || 0}%`,
          icon: "savings",
          iconBg: "bg-orange-500",
        },
      ]);

      // 5. Categories
      // Fetch from analytics to get coloring and grouped data
      try {
        const analytics = await fetchWithAuth("/api/dashboard/analytics/{userId}", userId, {}, isSuper);
        const cats = analytics.expensesByCategory || [];

        // Calculate percentages
        const totalExp = cats.reduce((acc: number, curr: any) => acc + curr.value, 0);
        const catsWithPct = cats.map((c: any) => ({
          ...c,
          percentage: totalExp > 0 ? Math.round((c.value / totalExp) * 100) : 0
        })).sort((a: any, b: any) => b.value - a.value); // Sort highest expense first

        setCategories(catsWithPct);
      } catch (e) {
        console.warn("Analytics fetch failed", e);
        setCategories([]);
      }

    } catch (error) {
      console.error("Insights load error:", error);
      toast.error("Failed to load insights data");
    } finally {
      setLoading(false);
    }
  }, [userId, isSuper]);

  useEffect(() => {
    if (isLoaded && userId) {
      loadInsightsData();
    }

    const handleRefresh = () => loadInsightsData();
    window.addEventListener("transaction-added", handleRefresh);
    return () => window.removeEventListener("transaction-added", handleRefresh);
  }, [isLoaded, userId, loadInsightsData]);

  if (!isLoaded) return null;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Financial Insights" subtitle="Key metrics and AI-powered recommendations" />

      {/* Stat Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-card border border-border" />
          ))
        ) : (
          stats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={iconMap[stat.icon] || <RupeeIcon />}
              iconBg={stat.iconBg}
            />
          ))
        )}
      </div>

      {/* AI-Powered Insights */}
      <div className="mb-8 rounded-xl bg-primary p-6 text-primary-foreground">
        <h3 className="mb-4 text-lg font-semibold">AI-Powered Insights</h3>
        {loading ? (
          <p className="text-sm opacity-70 animate-pulse">Analyzing your financial habits...</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-white/10 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <span className="h-3 w-3 rounded-full bg-blue-300" />
                Smart Observation
              </div>
              <p className="text-sm leading-relaxed opacity-90">{aiInsights?.observation || "No specific patterns detected yet."}</p>
            </div>
            <div className="rounded-lg bg-white/10 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <span className="h-3 w-3 rounded-full bg-red-300" />
                Recommendation
              </div>
              <p className="text-sm leading-relaxed opacity-90">{aiInsights?.recommendation || "Continue tracking to see smart suggestions."}</p>
            </div>
          </div>
        )}
      </div>

      {/* Monthly Financial Summary */}
      <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Monthly Financial Summary</h3>
          <span className="text-sm text-muted-foreground">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
        </div>
        {loading ? (
          <div className="h-24 animate-pulse rounded-lg bg-muted" />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-600">Total Income</p>
              <p className="text-2xl font-bold text-foreground">₹{(summary?.income || 0).toLocaleString()}</p>
            </div>
            <div className="rounded-lg border-l-4 border-orange-500 bg-orange-50 p-4">
              <p className="text-sm font-medium text-orange-600">Total Expenses</p>
              <p className="text-2xl font-bold text-foreground">₹{(summary?.expense || 0).toLocaleString()}</p>
            </div>
            <div className="rounded-lg border-l-4 border-green-500 bg-green-50 p-4">
              <p className="text-sm font-medium text-green-600">Net Savings</p>
              <p className="text-2xl font-bold text-foreground">₹{(summary?.net || 0).toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Grid: Categories + Recent Transactions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Expense Categories */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Top Expense Categories</h3>
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(i => <div key={i} className="h-4 bg-muted rounded w-full" />)}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {categories.length > 0 ? categories.map((cat) => (
                <div key={cat.name}>
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color || "#4F46E5" }} />
                      <span className="text-sm text-foreground">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-foreground">₹{cat.value.toLocaleString()}</span>
                      <span className="text-muted-foreground">({cat.percentage}%)</span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-2 rounded-full" style={{ backgroundColor: cat.color || "#4F46E5", width: `${cat.percentage}%` }} />
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground text-center py-4">No category data available yet.</p>}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Recent Transactions</h3>
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 bg-muted rounded w-full" />)}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {transactions.length > 0 ? transactions.slice(0, 10).map((tx, i) => (
                <div key={tx.id || i} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${tx.type === "income" || tx.type === "credit" ? "text-green-600" : "text-red-500"}`}>
                      {tx.type === "income" || tx.type === "credit" ? "+" : "-"}₹{Math.abs(tx.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">{tx.category}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No recent transactions.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
