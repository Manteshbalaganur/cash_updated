"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { WalletCard } from "@/components/wallets/wallet-card";
import { useUser } from "@/lib/user-context";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { fetchWithAuth } from "@/lib/api-client";
import { toast } from "sonner";

interface Wallets {
  normal: number;
  cashback: number;
  emergency: number;
}

export default function WalletsPage() {
  const { isSuper } = useUser();
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const [walletsData, setWalletsData] = useState<Wallets | null>(null);
  const [loading, setLoading] = useState(true);

  const loadWallets = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const data = await fetchWithAuth("/api/wallets/{userId}", userId, {}, isSuper);
      setWalletsData(data);
    } catch (error) {
      console.error("Error loading wallets:", error);
      toast.error("Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  }, [userId, isSuper]);

  useEffect(() => {
    if (isLoaded && userId) {
      loadWallets();
    }
  }, [isSuper, userId, isLoaded, loadWallets]);

  if (!isLoaded) return null;

  const totalBalance = walletsData ? (walletsData.normal + walletsData.cashback + walletsData.emergency) : 0;

  const walletCards = [
    {
      id: "normal",
      name: "Normal Wallet",
      description: "Active balance for daily spending",
      balance: walletsData?.normal || 0,
      status: "Active",
      color: "blue",
      actions: ["View Transactions"],
    },
    {
      id: "emergency",
      name: "Emergency Fund",
      description: "Locked savings balance",
      balance: walletsData?.emergency || 0,
      status: "Protected",
      color: "purple",
      actions: ["Transfer to Normal Wallet"],
    },
    {
      id: "cashback",
      name: "Cashback Wallet",
      description: "Auto-invested by default",
      balance: walletsData?.cashback || 0,
      status: "Auto-Invest",
      color: "green",
      actions: ["Withdraw to Bank", "Spend on Purchase"],
    },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Wallet Management" subtitle="Manage your funds across different wallets" />

      {/* Wallet Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {walletCards.map((wallet) => (
          <WalletCard key={wallet.id} wallet={wallet as any} />
        ))}
      </div>

      {/* Total Wallet Overview */}
      <div className="rounded-xl bg-foreground p-6 text-card">
        <h3 className="mb-4 text-lg font-semibold">Total Wallet Overview</h3>
        {loading ? (
          <div className="flex justify-center py-4">Loading stats...</div>
        ) : (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div>
              <p className="text-sm opacity-70">Total Balance</p>
              <p className="text-2xl font-bold">${totalBalance.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm opacity-70">Normal Wallet</p>
              <p className="text-2xl font-bold">${(walletsData?.normal || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm opacity-70">Emergency Fund</p>
              <p className="text-2xl font-bold">${(walletsData?.emergency || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm opacity-70">Cashback</p>
              <p className="text-2xl font-bold">${(walletsData?.cashback || 0).toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
