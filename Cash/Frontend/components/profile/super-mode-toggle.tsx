"use client";

import { useUser } from "@/lib/user-context";

export function SuperModeToggle() {
  const { isSuper, toggleMode } = useUser();

  const handleToggle = () => {
    toggleMode();
  };

  return (
    <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-primary to-accent p-5 text-primary-foreground shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12h8" />
            {!isSuper && <path d="M12 8v8" />}
          </svg>
        </div>
        <div>
          <h3 className="font-semibold">Super User Mode</h3>
          <p className="text-sm opacity-90">Access advanced portfolio analytics and investment planning</p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleToggle}
        className={`relative h-7 w-12 rounded-full transition-colors ${isSuper ? "bg-white" : "bg-white/30"}`}
        aria-label="Toggle Super User Mode"
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full transition-all ${
            isSuper ? "left-[22px] bg-primary" : "left-0.5 bg-white"
          }`}
        />
      </button>
    </div>
  );
}
