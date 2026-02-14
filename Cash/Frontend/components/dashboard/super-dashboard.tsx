"use client";

import React from "react";

import {
  superUserStats,
  assetLiabilityTrend,
  assetDistribution,
  liabilitiesBreakdown,
  financialHealthScores,
} from "@/lib/mock-data";
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

const liabilityColors = ["bg-blue-600", "bg-red-500", "bg-red-400"];

export function SuperDashboard() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Advanced Financial Dashboard"
        subtitle="Comprehensive overview of your wealth and investments"
      />

      {/* Stat Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {superUserStats.map((stat, i) => (
          <div
            key={stat.label}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-lg ${statIcons[i].bg}`}
              >
                {statIcons[i].icon}
              </div>
              {stat.label === "Financial Health Score" ? (
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                  Excellent
                </span>
              ) : stat.change ? (
                <span
                  className={`text-xs font-medium ${
                    stat.changeType === "positive"
                      ? "text-green-600"
                      : stat.changeType === "negative"
                        ? "text-red-500"
                        : "text-muted-foreground"
                  }`}
                >
                  {stat.changeType === "positive" && "\u2197 "}
                  {stat.changeType === "negative" && "\u2198 "}
                  {stat.change}
                </span>
              ) : null}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground">
                {stat.value}
                {stat.label === "Financial Health Score" && (
                  <span className="text-base font-normal text-muted-foreground">
                    /10{" "}
                    <span className="text-xs">average</span>
                  </span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Asset vs Liability Trend */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Asset vs Liability Trend
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={assetLiabilityTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 92%)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "hsl(220 10% 45%)" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "hsl(220 10% 45%)" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid hsl(220 20% 90%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="assets"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ r: 5, fill: "#10B981" }}
                name="assets"
              />
              <Line
                type="monotone"
                dataKey="liabilities"
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ r: 5, fill: "#EF4444" }}
                name="liabilities"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Asset Distribution */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Asset Distribution
          </h3>
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
              <Tooltip
                formatter={(value: number) => [
                  `$${value.toLocaleString()}`,
                  "",
                ]}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid hsl(220 20% 90%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 flex flex-col gap-2">
            {assetDistribution.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2 text-foreground">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name}
                </div>
                <span className="font-medium text-foreground">
                  ${(item.value / 1000).toFixed(0)}k
                </span>
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
          <div className="flex flex-col gap-5">
            {liabilitiesBreakdown.map((item, idx) => (
              <div key={item.name}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm text-foreground">{item.name}</span>
                  <span className="text-sm font-semibold text-foreground">
                    ${item.amount.toLocaleString()}
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted">
                  <div
                    className={`h-2.5 rounded-full ${liabilityColors[idx]}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="mt-1 flex items-center justify-between border-t border-border pt-4">
              <span className="font-semibold text-foreground">
                Total Liabilities
              </span>
              <span className="text-lg font-bold text-foreground">$40,000</span>
            </div>
          </div>
        </div>

        {/* Risk Profile */}
        <div className="overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 via-slate-700 to-purple-900 p-6 text-white shadow-lg">
          <div className="mb-1 flex items-center gap-2">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <h3 className="text-lg font-semibold">Risk Profile</h3>
          </div>
          <p className="mb-5 text-sm text-gray-300">Moderate</p>

          {/* Recommended Allocation Bar */}
          <div className="mb-5">
            <p className="mb-2 text-sm font-medium text-gray-200">
              Recommended Allocation
            </p>
            <div className="flex h-8 w-full overflow-hidden rounded-lg">
              <div
                className="flex items-center justify-center bg-blue-500 text-xs font-medium"
                style={{ width: "45%" }}
              >
                45
              </div>
              <div
                className="flex items-center justify-center bg-green-500 text-xs font-medium"
                style={{ width: "30%" }}
              >
                30
              </div>
              <div
                className="flex items-center justify-center bg-yellow-500 text-xs font-medium text-yellow-900"
                style={{ width: "10%" }}
              >
                10
              </div>
              <div
                className="flex items-center justify-center bg-gray-400 text-xs font-medium text-gray-800"
                style={{ width: "15%" }}
              >
                15
              </div>
            </div>
            <div className="mt-1.5 flex justify-between text-xs text-gray-300">
              <span>Equity</span>
              <span>Debt</span>
              <span>Gold</span>
              <span>Cash</span>
            </div>
          </div>

          {/* AI Insights */}
          <div className="mb-5">
            <p className="mb-2 text-sm font-medium text-gray-200">
              AI Insights
            </p>
            <ul className="flex flex-col gap-2 text-sm text-gray-200">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-400" />
                Portfolio well-diversified across asset classes
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-green-400" />
                Debt-to-asset ratio is healthy at 12.3%
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-yellow-400" />
                Consider increasing equity allocation by 5%
              </li>
            </ul>
          </div>

          <a
            href="/investments"
            className="block w-full rounded-lg border border-white/30 bg-white/10 py-2.5 text-center text-sm font-medium transition-colors hover:bg-white/20"
          >
            View Detailed Investment Plan
          </a>
        </div>
      </div>

      {/* Financial Health Breakdown */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-5 text-lg font-semibold text-foreground">
          Financial Health Breakdown
        </h3>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {financialHealthScores.map((item) => (
            <div key={item.label}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {item.label}
                </span>
                <span className="text-sm font-bold text-primary">
                  {item.score}/10
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-muted">
                <div
                  className="h-2.5 rounded-full bg-primary"
                  style={{ width: `${item.score * 10}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
