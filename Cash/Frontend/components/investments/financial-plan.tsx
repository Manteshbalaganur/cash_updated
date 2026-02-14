"use client";

const planPhases = [
  {
    title: "Year 1-2",
    subtitle: "Building Foundation",
    items: [
      "Establish emergency fund (6 months)",
      "Begin systematic investments in equity",
      "Pay down high-interest debt",
    ],
  },
  {
    title: "Year 3-5",
    subtitle: "Growth Phase",
    items: [
      "Maximize equity allocation",
      "Diversify into international markets",
      "Consider real estate investments",
    ],
  },
  {
    title: "Year 5+",
    subtitle: "Wealth Preservation",
    items: [
      "Rebalance towards stable assets",
      "Focus on passive income streams",
      "Tax-efficient wealth transfer planning",
    ],
  },
];

export function FinancialPlan() {
  return (
    <div className="rounded-xl bg-foreground p-6 text-card shadow-sm">
      <h3 className="mb-6 text-lg font-bold">Long-term Financial Plan</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {planPhases.map((phase) => (
          <div key={phase.title} className="rounded-lg bg-white/10 p-5">
            <h4 className="text-lg font-bold">{phase.title}</h4>
            <p className="mb-3 text-sm opacity-80">{phase.subtitle}</p>
            <ul className="flex flex-col gap-2">
              {phase.items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm opacity-90">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs opacity-70">
        This plan adapts to your changing life circumstances and market conditions. Review quarterly with AI insights for optimal results.
      </p>
    </div>
  );
}
