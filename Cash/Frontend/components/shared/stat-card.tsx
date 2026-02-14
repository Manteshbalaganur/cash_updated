"use client";

import React from "react"

import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative";
  icon: React.ReactNode;
  iconBg?: string;
}

export function StatCard({ label, value, change, changeType, icon, iconBg = "bg-primary" }: StatCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg text-white", iconBg)}>
          {icon}
        </div>
        {change && (
          <span
            className={cn(
              "text-xs font-medium",
              changeType === "positive" && "text-green-600",
              changeType === "negative" && "text-red-500",
              !changeType && "text-muted-foreground"
            )}
          >
            {changeType === "positive" && "\u2197 "}
            {changeType === "negative" && "\u2198 "}
            {change}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}
