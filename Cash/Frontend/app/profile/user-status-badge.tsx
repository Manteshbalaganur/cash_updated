"use client";

import { useUser } from "@/lib/user-context";

export function UserStatusBadge() {
    const { isSuper, isLoaded } = useUser();

    if (!isLoaded) return <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />;

    return (
        <span className={`rounded-full px-4 py-1 text-xs font-bold ${isSuper
                ? "bg-orange-500 text-white shadow-sm"
                : "bg-primary/10 text-primary"
            }`}>
            {isSuper ? "Super User" : "Normal User"}
        </span>
    );
}
