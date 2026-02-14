"use client";

import { useUser } from "@/lib/user-context";

export function ProfileHeader() {
  const { user, isSuper } = useUser();

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
        {user.name.charAt(0).toUpperCase()}
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <span className="mt-1 inline-block rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
          {isSuper ? "Super User" : "Normal User"}
        </span>
      </div>
    </div>
  );
}
