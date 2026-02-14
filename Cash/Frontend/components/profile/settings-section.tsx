"use client";

import React from "react"

interface SettingsItem {
  icon: React.ReactNode;
  label: string;
}

interface SettingsSectionProps {
  title: string;
  items: SettingsItem[];
}

export function SettingsSection({ title, items }: SettingsSectionProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-4 text-base font-bold text-foreground">{title}</h3>
      <div className="flex flex-col divide-y divide-border">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            className="flex items-center justify-between bg-transparent py-3 text-left transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">{item.icon}</span>
              <span className="text-sm text-foreground">{item.label}</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
