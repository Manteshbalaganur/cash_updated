"use client";

interface MonthlySummaryProps {
  data?: {
    income: number;
    expense: number;
    net: number;
    savings_rate: number;
  };
  loading?: boolean;
}

export function MonthlySummary({ data, loading }: MonthlySummaryProps) {
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  const summaryItems = [
    { label: "Total Income", value: `₹${(data?.income || 0).toLocaleString()}`, color: "text-blue-300" },
    { label: "Total Expenses", value: `₹${(data?.expense || 0).toLocaleString()}`, color: "text-orange-300" },
    { label: "Net Savings", value: `₹${(data?.net || 0).toLocaleString()}`, color: "text-green-300" },
  ];

  if (loading) {
    return (
      <div className="rounded-xl bg-primary p-6 text-primary-foreground shadow-sm animate-pulse">
        <div className="h-20 flex items-center justify-center">
          <p>Loading monthly summary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-primary p-6 text-primary-foreground shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Monthly Summary</h3>
          <p className="text-sm opacity-80">{currentMonth}</p>
        </div>
        <div className="text-right">
          <p className="text-sm opacity-80">Savings Rate</p>
          <p className="text-2xl font-bold">{data?.savings_rate || 0}%</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryItems.map((item) => (
          <div key={item.label} className="rounded-lg bg-white/10 p-4">
            <p className={`text-sm ${item.color}`}>{item.label}</p>
            <p className="text-xl font-bold">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
