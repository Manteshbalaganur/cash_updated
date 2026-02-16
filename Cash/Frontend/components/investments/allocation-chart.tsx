"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface AllocationItem {
  name: string;
  value: number;
  color: string;
}

interface AllocationChartProps {
  data: AllocationItem[];
}

export function AllocationChart({ data }: AllocationChartProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-foreground">Recommended Asset Allocation</h3>
      <div className="flex flex-col items-center gap-6 lg:flex-row">
        <ResponsiveContainer width="100%" height={220} className="max-w-[250px]">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" nameKey="name" paddingAngle={2}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [`${value}%`, ""]} contentStyle={{ backgroundColor: "white", border: "1px solid hsl(220 20% 90%)", borderRadius: "8px", fontSize: "12px" }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-3">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-foreground">{item.name}</span>
              <span className="ml-auto text-lg font-bold text-foreground">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
