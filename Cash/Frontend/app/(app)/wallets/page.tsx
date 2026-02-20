// "use client";

// import { useState, useEffect, useCallback } from "react";
// import { PageHeader } from "@/components/shared/page-header";
// import { WalletCard } from "@/components/wallets/wallet-card";
// import { useUser } from "@/lib/user-context";
// import { useRouter } from "next/navigation";
// import { useAuth } from "@clerk/nextjs";
// import { fetchWithAuth } from "@/lib/api-client";
// import { toast } from "sonner";

// interface Wallets {
//   normal: number;
//   cashback: number;
//   emergency: number;
// }

// export default function WalletsPage() {
//   const { isSuper } = useUser();
//   const router = useRouter();
//   const { userId, isLoaded } = useAuth();
//   const [walletsData, setWalletsData] = useState<Wallets | null>(null);
//   const [loading, setLoading] = useState(true);

//   const loadWallets = useCallback(async () => {
//     if (!userId) return;
//     try {
//       setLoading(true);
//       const data = await fetchWithAuth("/api/wallets/{userId}", userId, {}, isSuper);
//       setWalletsData(data);
//     } catch (error) {
//       console.error("Error loading wallets:", error);
//       toast.error("Failed to load wallet data");
//     } finally {
//       setLoading(false);
//     }
//   }, [userId, isSuper]);

//   useEffect(() => {
//     if (isLoaded && userId) {
//       loadWallets();
//     }
//   }, [isSuper, userId, isLoaded, loadWallets]);

//   if (!isLoaded) return null;

//   const totalBalance = walletsData ? (walletsData.normal + walletsData.cashback + walletsData.emergency) : 0;

//   const walletCards = [
//     {
//       id: "normal",
//       name: "Normal Wallet",
//       description: "Active balance for daily spending",
//       balance: walletsData?.normal || 0,
//       status: "Active",
//       color: "blue",
//       actions: ["View Transactions"],
//     },
//     {
//       id: "emergency",
//       name: "Emergency Fund",
//       description: "Locked savings balance",
//       balance: walletsData?.emergency || 0,
//       status: "Protected",
//       color: "purple",
//       actions: ["Transfer to Normal Wallet"],
//     },
//     {
//       id: "cashback",
//       name: "Cashback Wallet",
//       description: "Auto-invested by default",
//       balance: walletsData?.cashback || 0,
//       status: "Auto-Invest",
//       color: "green",
//       actions: ["Withdraw to Bank", "Spend on Purchase"],
//     },
//   ];

//   return (
//     <div className="mx-auto max-w-7xl">
//       <PageHeader title="Wallet Management" subtitle="Manage your funds across different wallets" />

//       {/* Wallet Cards */}
//       <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
//         {walletCards.map((wallet) => (
//           <WalletCard key={wallet.id} wallet={wallet as any} />
//         ))}
//       </div>

//       {/* Total Wallet Overview */}
//       <div className="rounded-xl bg-foreground p-6 text-card">
//         <h3 className="mb-4 text-lg font-semibold">Total Wallet Overview</h3>
//         {loading ? (
//           <div className="flex justify-center py-4">Loading stats...</div>
//         ) : (
//           <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
//             <div>
//               <p className="text-sm opacity-70">Total Balance</p>
//               <p className="text-2xl font-bold">${totalBalance.toLocaleString()}</p>
//             </div>
//             <div>
//               <p className="text-sm opacity-70">Normal Wallet</p>
//               <p className="text-2xl font-bold">${(walletsData?.normal || 0).toLocaleString()}</p>
//             </div>
//             <div>
//               <p className="text-sm opacity-70">Emergency Fund</p>
//               <p className="text-2xl font-bold">${(walletsData?.emergency || 0).toLocaleString()}</p>
//             </div>
//             <div>
//               <p className="text-sm opacity-70">Cashback</p>
//               <p className="text-2xl font-bold">${(walletsData?.cashback || 0).toLocaleString()}</p>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { WalletCard } from "@/components/wallets/wallet-card";
import { useUser } from "@/lib/user-context";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { fetchWithAuth } from "@/lib/api-client";
import { toast } from "sonner";
// import axios from "axios";
import { Button } from "@/components/ui/button";

interface Wallets {
  normal: number;
  cashback: number;
  emergency: number;
}

interface Prediction {
  investment: string;
  predicted_return: string;
  risk: string;
  confidence: string;
  explanation: string;
}

export default function WalletsPage() {
  const { isSuper } = useUser();
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const [walletsData, setWalletsData] = useState<Wallets | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Prediction states for emergency fund
  const [durationMonths, setDurationMonths] = useState<number>(6);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [predictLoading, setPredictLoading] = useState(false);
  const [predictError, setPredictError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const durations = [
    { value: 6, label: '6 months' },
    { value: 12, label: '1 year' },
    { value: 24, label: '2 years' },
    { value: 60, label: '5 years' },
  ];

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

  const fetchPredictions = async () => {
    if (!walletsData?.emergency || walletsData.emergency <= 0) {
      setPredictError("Emergency fund balance is zero");
      return;
    }

    setPredictLoading(true);
    setPredictError(null);
    setPredictions([]);

    try {
      const response = await axios.post('ws://localhost:8000/interact', {
        amount: Number(walletsData.emergency),
        duration_months: durationMonths,
      });

      const data = response.data;

      if (data.results && Array.isArray(data.results)) {
        setPredictions(data.results);
      } else {
        setPredictError('Server se galat response aaya');
      }
    } catch (err: any) {
      console.error('Prediction error:', err);
      setPredictError(
        err.response?.data?.error ||
        err.message ||
        'Backend se connect nahi ho pa raha. Server check kar.'
      );
    } finally {
      setPredictLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    fetchPredictions();
  };

  useEffect(() => {
    if (isLoaded && userId) {
      loadWallets();
    }
  }, [isSuper, userId, isLoaded, loadWallets]);

  // Auto-fetch predictions when wallet data loads
  useEffect(() => {
    if (walletsData?.emergency && walletsData.emergency > 0) {
      fetchPredictions();
    }
  }, [walletsData]);

  if (!isLoaded) return null;

  const totalBalance = walletsData ? (walletsData.normal + walletsData.cashback + walletsData.emergency) : 0;

  // Custom Emergency Fund Card with Predictions
  const EmergencyFundCard = () => (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">Emergency Fund</h3>
            <p className="text-sm text-muted-foreground">Locked savings balance</p>
          </div>
          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            Protected
          </span>
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">Balance</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            ₹{(walletsData?.emergency || 0).toLocaleString()}
          </p>
        </div>

        {/* Duration Selector and Generate Button */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <select
              value={durationMonths}
              onChange={(e) => setDurationMonths(Number(e.target.value))}
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {durations.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            
            <Button
              onClick={fetchPredictions}
              disabled={predictLoading || !walletsData?.emergency}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              {predictLoading ? 'Generating...' : 'Generate Prediction'}
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/transactions?wallet=emergency')}
            className="flex-1"
          >
            View Transactions →
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/transfer?from=emergency')}
            className="flex-1"
          >
            Transfer to Normal Wallet →
          </Button>
        </div>
      </div>
    </div>
  );

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
        {/* Normal Wallet */}
        {walletCards.filter(w => w.id === "normal").map((wallet) => (
          <WalletCard key={wallet.id} wallet={wallet as any} />
        ))}

        {/* Emergency Fund with Predictions */}
        <EmergencyFundCard />

        {/* Cashback Wallet */}
        {walletCards.filter(w => w.id === "cashback").map((wallet) => (
          <WalletCard key={wallet.id} wallet={wallet as any} />
        ))}
      </div>

      {/* Prediction Results Section - NEW */}
      <div className="mb-8 rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Prediction Results ({durationMonths} months)
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              ₹{walletsData?.emergency?.toLocaleString() || 0}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={predictLoading}
              className="gap-2"
            >
              <svg 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                className={predictLoading ? "animate-spin" : ""}
              >
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Refresh
            </Button>
          </div>
        </div>

        {/* Prediction Content */}
        {predictLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-600 border-t-transparent mb-4"></div>
            <p className="text-muted-foreground">Generating predictions...</p>
          </div>
        ) : predictError ? (
          <div className="text-center py-12">
            <div className="mb-4 text-red-500">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
              Failed to fetch predictions
            </h4>
            <p className="text-muted-foreground mb-4">{predictError}</p>
            <Button onClick={fetchPredictions} variant="outline">
              Try Again
            </Button>
          </div>
        ) : predictions.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4 text-muted-foreground">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold mb-2">No predictions available</h4>
            <p className="text-muted-foreground mb-4">Please check the backend connection and try again.</p>
            <Button onClick={fetchPredictions} variant="outline">
              Generate Predictions
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {predictions.map((pred, idx) => (
              <div key={idx} className="rounded-lg border bg-muted/30 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-purple-600 dark:text-purple-400">
                    {pred.investment}
                  </h4>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    {pred.predicted_return}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs mb-3">
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    Risk: {pred.risk}
                  </span>
                  <span className="rounded-full bg-green-100 px-2 py-1 text-green-700 dark:bg-green-900 dark:text-green-300">
                    Confidence: {pred.confidence}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {pred.explanation}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Portfolio Insights Section - NEW */}
      <div className="mb-8 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border p-8">
        <div className="flex flex-col items-center text-center md:flex-row md:text-left md:justify-between md:items-center">
          <div>
            <h3 className="text-xl font-semibold mb-2">AI Portfolio Insights</h3>
            <p className="text-muted-foreground max-w-2xl">
              Use our smart tools to analyze your portfolio and get personalized investment advice. 
              Click the AI Services button to explore more.
            </p>
          </div>
          <Button
            onClick={() => router.push('/ai-services')}
            className="mt-4 md:mt-0 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2"
          >
            AI Services →
          </Button>
        </div>
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
              <p className="text-2xl font-bold">₹{totalBalance.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm opacity-70">Normal Wallet</p>
              <p className="text-2xl font-bold">₹{(walletsData?.normal || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm opacity-70">Emergency Fund</p>
              <p className="text-2xl font-bold">₹{(walletsData?.emergency || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm opacity-70">Cashback</p>
              <p className="text-2xl font-bold">₹{(walletsData?.cashback || 0).toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}