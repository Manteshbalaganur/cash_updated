"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/user-context";
import { useAuth } from "@clerk/nextjs";
import { fetchWithAuth } from "@/lib/api-client";
import { PageHeader } from "@/components/shared/page-header";
import { AllocationChart } from "@/components/investments/allocation-chart";
import { InstrumentCard } from "@/components/investments/instrument-card";
import { FinancialPlan } from "@/components/investments/financial-plan";
import { toast } from "sonner";

// Static recommendations (generic advice)
const recommendedInstruments = [
  { name: "Index Funds (S&P 500)", description: "Low-cost market tracking", allocation: "40%", recommended: true },
  { name: "Government Bonds", description: "Safe, steady returns", allocation: "30%", recommended: true },
  { name: "High-Yield Savings", description: "Liquid emergency fund", allocation: "20%", recommended: true },
  { name: "Individual Tech Stocks", description: "High growth potential", allocation: "10%", recommended: false },
];

export default function InvestmentsPage() {
  const { isSuper, isLoaded: userLoaded } = useUser();
  const { userId, isLoaded: authLoaded } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [allocationData, setAllocationData] = useState<any[]>([]);
  const [riskProfile, setRiskProfile] = useState("Unknown");
  const [healthScore, setHealthScore] = useState(0);
  const [projectedReturns, setProjectedReturns] = useState<any>({ "1y": "0%", "3y": "0%", "5y": "0%" });
  const [riskMetrics, setRiskMetrics] = useState<any>({ volatility: "N/A", diversification: "N/A", liquidity: "N/A" });
  const [strategyText, setStrategyText] = useState("");

  const loadInvestmentData = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);

      // Fetch Real Investment Plan from Backend
      const plan = await fetchWithAuth("/api/investments/plan/{userId}", userId, {}, isSuper);

      if (plan) {
        setAllocationData(plan.allocation || []);
        setRiskProfile(plan.risk_profile || "Unknown");
        setHealthScore(plan.health_score || 0);
        setProjectedReturns(plan.projected_returns || {});
        setRiskMetrics(plan.risk_metrics || {});
        setStrategyText(plan.strategy_text || "");
      }

    } catch (e) {
      console.error("Investment data load error", e);
      toast.error("Failed to load investment profile");
    } finally {
      setLoading(false);
    }
  }, [userId, isSuper]);

  useEffect(() => {
    if (userLoaded && !isSuper) {
      router.replace("/dashboard");
    } else if (userId && userLoaded) {
      loadInvestmentData();
    }
  }, [isSuper, userLoaded, userId, router, loadInvestmentData]);

  if (!userLoaded || !isSuper || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="AI Investment Planning"
        subtitle="Personalized investment strategy based on your current wallet allocation"
      />

      {/* AI Strategy Banner */}
      <div className="mb-8 rounded-xl bg-gradient-to-r from-green-600 to-green-500 p-5 text-white shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          <h3 className="font-semibold">AI-Generated Strategy</h3>
        </div>
        <p className="text-sm opacity-95 leading-relaxed">
          {strategyText || (riskProfile === "Unknown" ? "Add funds to your wallets to unlock personalized investment advice." :
            `Your current portfolio indicates a ${riskProfile.toLowerCase()} risk profile. We recommend maintaining a healthy emergency fund while exploring higher-yield options for your surplus cash.`)}
        </p>
        <div className="mt-3 flex items-center gap-6 text-sm">
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
            Risk: <strong>{riskProfile}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            Health Score: <strong>{healthScore}/10</strong>
          </span>
        </div>
      </div>

      {/* Allocation Chart + Expected Returns */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {allocationData.length > 0 ? (
          <AllocationChart data={allocationData} />
        ) : (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed text-muted-foreground bg-card">
            No allocation data available
          </div>
        )}

        <div className="flex flex-col gap-6">
          {/* Expected Returns (Dynamic based on Risk) */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-foreground">Proj. Returns ({riskProfile})</h3>
            <div className="flex flex-col gap-3">
              {[
                { label: "1 Year", range: projectedReturns["1y"] || "0%", width: "40%" },
                { label: "3 Years", range: projectedReturns["3y"] || "0%", width: "55%" },
                { label: "5+ Years", range: projectedReturns["5y"] || "0%", width: "70%" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-4">
                  <span className="w-16 text-sm text-muted-foreground">{item.label}</span>
                  <div className="flex-1">
                    <div className="h-3 w-full rounded-full bg-muted">
                      <div className="h-3 rounded-full bg-green-500" style={{ width: item.width }} />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{item.range}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Metrics */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-3 text-base font-semibold text-foreground">Risk Metrics</h3>
            <div className="flex flex-col gap-2">
              {[
                { label: "Volatility", value: riskMetrics.volatility || "N/A", color: (riskMetrics.volatility === "High" || riskMetrics.volatility === "Medium") ? "text-yellow-500" : "text-green-600" },
                { label: "Diversification", value: riskMetrics.diversification || "N/A", color: riskMetrics.diversification === "Low" ? "text-red-500" : "text-green-600" },
                { label: "Liquidity", value: riskMetrics.liquidity || "N/A", color: "text-green-600" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-1">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className={`text-sm font-semibold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Why this allocation */}
      <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <h3 className="text-sm font-semibold text-foreground">Why this allocation?</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Based on your {riskProfile.toLowerCase()} risk profile and financial health score of {healthScore}/10, we've dynamically adjusted your projected returns. {riskProfile === "Conservative" ? "We prioritize capital preservation." : "We prioritize growth."}
        </p>
      </div>

      {/* Recommended Investment Instruments */}
      <div className="mb-8">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Recommended Investment Instruments</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {recommendedInstruments.map((inst) => (
            <InstrumentCard
              key={inst.name}
              name={inst.name}
              description={inst.description}
              allocation={inst.allocation}
              recommended={inst.recommended}
            />
          ))}
        </div>
      </div>

      {/* Long-term Financial Plan */}
      <FinancialPlan />
    </div>
  );
}
