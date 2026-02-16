"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useUser } from "@/lib/user-context";
import { fetchWithAuth } from "@/lib/api-client";
import { PageHeader } from "@/components/shared/page-header";
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast } from "sonner";

const statIcons = [
  // Net Worth - blue
  {
    bg: "bg-blue-600",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  // Total Assets - green
  {
    bg: "bg-green-600",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
        <rect x="2" y="3" width="20" height="18" rx="2" />
        <path d="M2 9h20" />
        <path d="M9 21V9" />
      </svg>
    ),
  },
  // Total Liabilities - red
  {
    bg: "bg-red-500",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  // Financial Health Score - green circle
  {
    bg: "bg-green-500",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v8" />
        <path d="M8 12h8" />
      </svg>
    ),
  },
];

export function SuperDashboard() {
  const { userId } = useAuth();
  const { isSuper } = useUser();
  const [loading, setLoading] = useState(true);

  // Real Data States
  const [stats, setStats] = useState<any[]>([]);
  const [assetDistribution, setAssetDistribution] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [liabilities, setLiabilities] = useState<any[]>([]);
  const [healthScore, setHealthScore] = useState(0);

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);

      // 1. Fetch Wallets (Assets)
      const wallets = await fetchWithAuth("/api/wallets/{userId}", userId, {}, isSuper);
      const totalAssets = (wallets.normal || 0) + (wallets.cashback || 0) + (wallets.emergency || 0);

      // 2. Fetch Summary (Income/Trend)
      const summary = await fetchWithAuth("/api/dashboard/summary/{userId}", userId, {}, isSuper);

      // 3. Fetch Analytics (Trend Chart)
      const analytics = await fetchWithAuth("/api/dashboard/analytics/{userId}", userId, {}, isSuper);

      // --- CALCULATIONS ---

      // Liabilities -> currently 0 as we don't track debt yet
      const totalLiabilities = 0;

      // Net Worth
      const netWorth = totalAssets - totalLiabilities;

      // Health Score (Simple algorithm based on savings rate)
      // Savings Rate 20% -> 5/10. 50% -> 10/10.
      const savingsRate = summary.savings_rate || 0;
      const calcScore = Math.min(Math.max((savingsRate / 5), 1), 10).toFixed(1);
      setHealthScore(Number(calcScore));

      // Stats Array
      setStats([
        {
          label: "Net Worth",
          value: `$${netWorth.toLocaleString()}`,
          change: "Total Equity",
          changeType: "neutral",
        },
        {
          label: "Total Assets",
          value: `$${totalAssets.toLocaleString()}`,
          change: "Liquid & Invested",
          changeType: "positive",
        },
        {
          label: "Total Liabilities",
          value: `$${totalLiabilities.toLocaleString()}`,
          change: "No active debts",
          changeType: "positive",
        },
        {
          label: "Financial Health Score",
          value: calcScore,
          change: "Based on savings",
          changeType: "positive",
        },
      ]);

      // Asset Distribution (Wallets)
      setAssetDistribution([
        { name: "Liquid Cash", value: wallets.normal || 0, color: "#4F46E5" }, // Normal -> Blue
        { name: "Emergency Fund", value: wallets.emergency || 0, color: "#10B981" }, // Emergency -> Green
        { name: "Investments", value: wallets.cashback || 0, color: "#F59E0B" }, // Cashback -> Yellow
      ].filter(i => i.value > 0)); // Only show non-zero

      // Trend Data (Income vs Expense from Analytics)
      // Map analytics.incomeVsExpense to chart format
      const trends = (analytics.incomeVsExpense || []).map((m: any) => ({
        month: m.month,
        assets: m.income, // Temporary mapping: Income ~ Growth potential
        liabilities: m.expense, // Expense ~ Outflow
        net: m.income - m.expense
      }));
      setTrendData(trends);

      setLiabilities([]); // No liabilities breakdown yet

    } catch (e) {
      console.error("SuperDashboard load error", e);
      toast.error("Failed to load advanced data");
    } finally {
      setLoading(false);
    }
  }, [userId, isSuper]);

  useEffect(() => {
    if (userId) loadData();
  }, [userId, loadData]);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Advanced Financial Dashboard"
        subtitle="Comprehensive overview of your wealth and investments"
      />

      {/* Stat Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? Array(4).fill(0).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-card border border-border" />
        )) : stats.map((stat, i) => (
          <div
            key={stat.label}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${statIcons[i].bg}`}>
                {statIcons[i].icon}
              </div>
              <span className={`text-xs font-medium text-muted-foreground`}>
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground">
                {stat.value}
                {stat.label === "Financial Health Score" && <span className="text-base font-normal text-muted-foreground">/10</span>}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Income vs Expense Trend (Proxy for Asset Growth) */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Monthly Cash Flow Trend
          </h3>
          {loading ? <div className="h-[280px] animate-pulse bg-muted rounded-lg" /> : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ borderRadius: "8px" }} />
                <Legend />
                <Line type="monotone" dataKey="assets" name="Income" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="liabilities" name="Expenses" stroke="#EF4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
          {trendData.length === 0 && !loading && <p className="text-center text-sm text-muted-foreground p-4">Not enough data to show trend.</p>}
        </div>

        {/* Asset Distribution (Wallet Allocation) */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Liquid Asset Allocation
          </h3>
          {loading ? <div className="h-[200px] animate-pulse bg-muted rounded-lg" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={assetDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                  paddingAngle={2}
                >
                  {assetDistribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, ""]} />
              </PieChart>
            </ResponsiveContainer>
          )}
          {!loading && assetDistribution.length === 0 && <p className="text-center text-sm text-muted-foreground">Add funds to wallets to see allocation.</p>}

          <div className="mt-3 flex flex-col gap-2">
            {assetDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-foreground">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </div>
                <span className="font-medium text-foreground">${item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Liabilities & Risk Profile */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Liabilities Breakdown */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-5 text-lg font-semibold text-foreground">
            Liabilities Breakdown
          </h3>
          {/* Empty State for now */}
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <svg className="mb-3 h-10 w-10 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p>No active liabilities detected.</p>
            <p className="text-xs">Great job keeping debt low!</p>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <span className="font-semibold text-foreground">Total Liabilities</span>
            <span className="text-lg font-bold text-foreground">$0.00</span>
          </div>
        </div>

        {/* Risk Profile */}
        <div className="overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 via-slate-700 to-purple-900 p-6 text-white shadow-lg">
          <div className="mb-1 flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <h3 className="text-lg font-semibold">Risk Profile</h3>
          </div>
          <p className="mb-5 text-sm text-gray-300">
            {healthScore > 8 ? "Conservative (Healthy)" : healthScore > 5 ? "Moderate" : "Aggressive (Needs Audit)"}
          </p>

          <div className="mb-5">
            <p className="mb-2 text-sm font-medium text-gray-200">AI Insights</p>
            <ul className="flex flex-col gap-2 text-sm text-gray-200">
              {healthScore > 7 ? (
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-green-400"></span>Current savings rate supports healthy growth.</li>
              ) : (
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-yellow-400"></span>Consider reducing monthly expenses to boost score.</li>
              )}
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-400"></span>
                {assetDistribution.length > 0 ? "Portfolio has diverse liquidity sources." : "Start by funding your Normal Wallet."}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
