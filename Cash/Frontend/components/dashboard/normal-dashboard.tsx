"use client";

import React, { useState, useEffect, useCallback } from "react"
import { useAuth } from "@clerk/nextjs";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { DollarIcon, TrendingUpIcon, ExpenseIcon, SavingsIcon } from "@/components/shared/stat-icons";
import { IncomeExpenseChart } from "./income-expense-chart";
import { CategoryPieChart } from "./category-pie-chart";
import { MonthlySummary } from "./monthly-summary";
import { fetchWithAuth } from "@/lib/api-client";
import { toast } from "sonner";

const iconMap: Record<string, React.ReactNode> = {
  dollar: <DollarIcon />,
  "trending-up": <TrendingUpIcon />,
  expense: <ExpenseIcon />,
  savings: <SavingsIcon />,
};

export function NormalDashboard() {
  const { userId, isLoaded } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  const loadDashboardData = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);

      // 1. Fetch Dashboard Summary (Cards)
      const summary = await fetchWithAuth("/api/dashboard/summary/{userId}", userId);

      // Update Stats Cards
      setStats([
        {
          label: "Net Savings (Total)", // or Total Balance if you prefer
          value: `$${(summary.net_savings || 0).toLocaleString()}`,
          icon: "dollar",
          iconBg: "bg-blue-500",
        },
        {
          label: "Monthly Income",
          value: `$${(summary.total_income || 0).toLocaleString()}`,
          icon: "trending-up",
          iconBg: "bg-green-500",
        },
        {
          label: "Monthly Expenses",
          value: `$${(summary.total_expenses || 0).toLocaleString()}`,
          icon: "expense",
          iconBg: "bg-red-500",
        },
        {
          label: "Savings Rate",
          value: `${summary.savings_rate || 0}%`,
          icon: "savings",
          iconBg: "bg-orange-500",
        },
      ]);

      // Update Monthly Summary Component Data
      setMonthlySummary({
        income: summary.total_income,
        expense: summary.total_expenses,
        net: summary.net_savings,
        savings_rate: summary.savings_rate
      });

      // 2. Fetch Analytics (Charts)
      const analytics = await fetchWithAuth("/api/dashboard/analytics/{userId}", userId);

      // Update Charts
      setChartData(analytics.incomeVsExpense || []);
      setCategoryData(analytics.expensesByCategory || []);

    } catch (error) {
      console.error("Dashboard load error:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isLoaded && userId) {
      loadDashboardData();
    }

    // Listen for new transactions to refresh
    const handleRefresh = () => loadDashboardData();
    window.addEventListener("transaction-added", handleRefresh);
    return () => window.removeEventListener("transaction-added", handleRefresh);
  }, [isLoaded, userId, loadDashboardData]);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Dashboard" subtitle="AI-Powered Finance Tracker" />

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
              icon={iconMap[stat.icon] || <DollarIcon />}
              iconBg={stat.iconBg}
            />
          ))
        )}
      </div>

      {/* Charts */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <IncomeExpenseChart data={chartData} loading={loading} />
        <CategoryPieChart data={categoryData} loading={loading} />
      </div>

      {/* Monthly Summary */}
      <MonthlySummary data={monthlySummary} loading={loading} />
    </div>
  );
}
