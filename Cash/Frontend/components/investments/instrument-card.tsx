"use client";

interface InstrumentCardProps {
  name: string;
  description: string;
  allocation: string;
  recommended?: boolean;
}

export function InstrumentCard({ name, description, allocation, recommended }: InstrumentCardProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-5 shadow-sm">
      <div>
        <h4 className="text-sm font-semibold text-foreground">{name}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
        {recommended && (
          <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-green-600">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            AI Recommended
          </span>
        )}
      </div>
      <span className="text-xl font-bold text-foreground">{allocation}</span>
    </div>
  );
}
