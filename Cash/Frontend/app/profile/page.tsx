"use client";

import { SignOutButton, useUser as useClerkUser } from "@clerk/nextjs";
import Link from "next/link";
import { useUser } from "@/lib/user-context";
import { SuperUserToggle } from "./super-user-toggle";

const ChevronRight = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 18 6-6-6-6" />
    </svg>
);

const UserIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
);

const MailIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-10 6L2 7" />
    </svg>
);

const BellIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
);

const ShieldIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const CreditCardIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" />
    </svg>
);

const HelpIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" x2="12.01" y1="17" y2="17" />
    </svg>
);

interface SettingsRowProps {
    icon: React.ReactNode;
    label: string;
}

const SettingsRow = ({ icon, label }: SettingsRowProps) => (
    <button className="flex w-full items-center justify-between px-6 py-4 transition-colors hover:bg-muted/50">
        <div className="flex items-center gap-3 text-sm font-medium text-foreground/80">
            <span className="text-muted-foreground">{icon}</span>
            {label}
        </div>
        <span className="text-muted-foreground/50">
            <ChevronRight />
        </span>
    </button>
);

export default function ProfilePage() {
    const { user: clerkUser, isLoaded: clerkLoaded } = useClerkUser();
    const { isSuper, user: contextUser } = useUser();

    if (!clerkLoaded) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!clerkUser) return null;

    return (
        <div className="min-h-screen bg-[#F8F9FA] px-4 py-8 md:py-12">
            <div className="mx-auto max-w-2xl space-y-6">

                {/* 1️⃣ Header Section */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Profile & Settings</h1>
                    <Link
                        href="/dashboard"
                        className="text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                    >
                        Back to Dashboard
                    </Link>
                </div>

                {/* 2️⃣ User Info Card */}
                <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card p-8 shadow-sm">
                    <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-primary/10 shadow-inner">
                        <img
                            src={clerkUser.imageUrl}
                            alt={clerkUser.fullName || "User Avatar"}
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-foreground">
                            {clerkUser.username || clerkUser.fullName || "User"}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {clerkUser.primaryEmailAddress?.emailAddress}
                        </p>
                    </div>
                    <span className={`rounded-full px-4 py-1 text-xs font-bold ${isSuper ? "bg-orange-500 text-white shadow-sm" : "bg-primary/10 text-primary"
                        }`}>
                        {isSuper ? "Super User" : "Normal User"}
                    </span>
                </div>

                {/* 3️⃣ Super User Mode Card */}
                {/* 3️⃣ Super User Mode Card */}
                <div className={`relative overflow-hidden rounded-3xl border border-border p-6 text-white shadow-md transition-all duration-500 ${isSuper ? "bg-gradient-to-br from-orange-500 to-red-600 shadow-orange-200" : "bg-gradient-to-br from-[#8B5CF6] to-[#6366F1]"
                    }`}>
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ${isSuper ? "text-yellow-200" : "text-blue-100"}`}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                                    <path d="M5 3v4" />
                                    <path d="M9 3v4" />
                                    <path d="M3 5h4" />
                                    <path d="M3 9h4" />
                                </svg>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold">
                                    {isSuper ? "Super Mode Active" : "Super User Mode"}
                                </h3>
                                <p className="text-sm font-medium text-white/80">
                                    {isSuper
                                        ? "Advanced portfolio & investment tools unlocked."
                                        : "Unlock advanced charts & investment planning."}
                                </p>
                            </div>
                        </div>
                        <SuperUserToggle />
                    </div>
                </div>


                {/* 4️⃣ Account Settings Section */}
                <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border bg-muted/20 px-6 py-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Account Settings</h4>
                    </div>
                    <div className="divide-y divide-border">
                        <SettingsRow icon={<UserIcon />} label="Edit Profile" />
                        <SettingsRow icon={<MailIcon />} label="Email Preferences" />
                        <SettingsRow icon={<BellIcon />} label="Notifications" />
                        <SettingsRow icon={<ShieldIcon />} label="Security & Password" />
                    </div>
                </div>

                {/* 5️⃣ Payment & Billing Section */}
                <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border bg-muted/20 px-6 py-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Payment & Billing</h4>
                    </div>
                    <SettingsRow icon={<CreditCardIcon />} label="Payment Methods" />
                </div>

                {/* 6️⃣ Support Section */}
                <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border bg-muted/20 px-6 py-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Support</h4>
                    </div>
                    <SettingsRow icon={<HelpIcon />} label="Help Center" />
                </div>

                {/* 7️⃣ Logout Button */}
                <div className="pt-4 text-center">
                    <SignOutButton signOutOptions={{ redirectUrl: "/" }}>
                        <button className="inline-flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-destructive/10 text-sm font-bold text-destructive transition-all hover:bg-destructive/15">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" />
                            </svg>
                            Logout
                        </button>
                    </SignOutButton>
                </div>

            </div>
        </div>
    );
}
