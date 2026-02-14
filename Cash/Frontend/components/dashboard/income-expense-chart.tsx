"use client";

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip } from "recharts";

interface IncomeExpenseChartProps {
  data?: any[];
  loading?: boolean;
}

export function IncomeExpenseChart({ data, loading }: IncomeExpenseChartProps) {
  if (loading) {
    return (
      <div className="flex h-[380px] w-full items-center justify-center rounded-xl border border-border bg-card shadow-sm">
        <p className="text-sm text-muted-foreground animate-pulse">Loading chart data...</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-foreground">Income vs Expenses</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data || []} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 90%)" />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(220 10% 45%)" }} />
          <YAxis tick={{ fontSize: 12, fill: "hsl(220 10% 45%)" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid hsl(220 20% 90%)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Legend />
          <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} name="income" />
          <Bar dataKey="expense" fill="#EF4444" radius={[4, 4, 0, 0]} name="expense" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
