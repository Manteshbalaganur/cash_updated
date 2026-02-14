"use client";

import { cn } from "@/lib/utils";
import type { WalletData } from "@/lib/mock-data";

interface WalletCardProps {
  wallet: WalletData;
}

const colorConfig: Record<string, { iconBg: string; statusBg: string; statusText: string; btnBg: string; btnText: string }> = {
  blue: { iconBg: "bg-blue-600", statusBg: "bg-blue-100", statusText: "text-blue-700", btnBg: "bg-primary", btnText: "text-primary-foreground" },
  purple: { iconBg: "bg-accent", statusBg: "bg-purple-100", statusText: "text-purple-700", btnBg: "bg-muted", btnText: "text-foreground" },
  green: { iconBg: "bg-green-600", statusBg: "bg-green-100", statusText: "text-green-700", btnBg: "bg-accent", btnText: "text-accent-foreground" },
};

export function WalletCard({ wallet }: WalletCardProps) {
  const colors = colorConfig[wallet.color] || colorConfig.blue;

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm">
      {/* Icon + Status */}
      <div className="mb-4 flex items-start justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg text-white", colors.iconBg)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        </div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-medium", colors.statusBg, colors.statusText)}>
          {wallet.status}
        </span>
      </div>

      {/* Name + Description */}
      <h3 className="text-lg font-semibold text-foreground">{wallet.name}</h3>
      <p className="mb-3 text-sm text-muted-foreground">{wallet.description}</p>

      {/* Balance */}
      <p className="text-xs text-muted-foreground">Balance</p>
      <p className="mb-4 text-3xl font-bold text-foreground">${wallet.balance.toLocaleString()}</p>

      {/* Actions */}
      <div className="mt-auto flex flex-col gap-2">
        {wallet.actions.map((action, i) => (
          <button
            type="button"
            key={action}
            className={cn(
              "w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
              i === 0 ? `${colors.btnBg} ${colors.btnText} hover:opacity-90` : "border border-border bg-card text-foreground hover:bg-muted"
            )}
          >
            {action} {i === 0 && "\u2192"}
          </button>
        ))}
      </div>
    </div>
  );
}
