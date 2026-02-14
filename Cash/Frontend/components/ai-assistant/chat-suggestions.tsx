"use client";

interface ChatSuggestionsProps {
  suggestions: string[];
  onSelect: (text: string) => void;
}

export function ChatSuggestions({ suggestions, onSelect }: ChatSuggestionsProps) {
  return (
    <div className="mb-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="mb-3 text-sm font-medium text-muted-foreground">Try asking me about:</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSelect(s)}
            className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-primary/5 hover:border-primary/30"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 text-accent">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
