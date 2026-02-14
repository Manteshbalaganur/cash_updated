"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/user-context";
import { PageHeader } from "@/components/shared/page-header";
import { AllocationChart } from "@/components/investments/allocation-chart";
import { InstrumentCard } from "@/components/investments/instrument-card";
import { FinancialPlan } from "@/components/investments/financial-plan";
import { investmentAllocation, investmentInstruments } from "@/lib/mock-data";

export default function InvestmentsPage() {
  const { isSuper, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSuper) {
      router.replace("/dashboard");
    }
  }, [isSuper, isLoaded, router]);

  if (!isLoaded || !isSuper) {
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
        subtitle="Personalized investment strategy powered by AI + MCP"
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
          This investment plan has been tailored to your financial goals, risk tolerance, and current portfolio. The recommendations are based on advanced AI analysis of market trends and your personal financial data.
        </p>
        <div className="mt-3 flex items-center gap-6 text-sm">
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
            Risk: <strong>Moderate</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            Health Score: <strong>8.4/10</strong>
          </span>
        </div>
      </div>

      {/* Allocation Chart + Expected Returns */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AllocationChart data={investmentAllocation} />

        <div className="flex flex-col gap-6">
          {/* Expected Returns */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-foreground">Expected Returns</h3>
            <div className="flex flex-col gap-3">
              {[
                { label: "1 Year", range: "8-10%", width: "40%" },
                { label: "3 Years", range: "10-12%", width: "55%" },
                { label: "5+ Years", range: "12-15%", width: "70%" },
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
                { label: "Volatility", value: "Medium", color: "text-yellow-600" },
                { label: "Diversification", value: "High", color: "text-green-600" },
                { label: "Liquidity", value: "High", color: "text-green-600" },
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
          Based on your moderate risk profile and strong financial health, this balanced approach maximizes growth potential while maintaining stability through diversification.
        </p>
      </div>

      {/* Recommended Investment Instruments */}
      <div className="mb-8">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Recommended Investment Instruments</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {investmentInstruments.map((inst) => (
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
