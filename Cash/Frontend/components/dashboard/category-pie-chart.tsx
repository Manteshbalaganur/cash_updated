"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface CategoryPieChartProps {
  data?: any[];
  loading?: boolean;
}

const COLORS = ["#4F46E5", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#6B7280"];

export function CategoryPieChart({ data, loading }: CategoryPieChartProps) {
  if (loading) {
    return (
      <div className="flex h-[380px] w-full items-center justify-center rounded-xl border border-border bg-card shadow-sm">
        <p className="text-sm text-muted-foreground animate-pulse">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-foreground">Expenses by Category</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data || []}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            dataKey="value"
            nameKey="name"
            paddingAngle={2}
          >
            {(data || []).map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid hsl(220 20% 90%)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number) => [`₹${value}`, ""]}
          />
          <Legend
            formatter={(value) => <span style={{ color: "hsl(224 30% 15%)", fontSize: "12px" }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
