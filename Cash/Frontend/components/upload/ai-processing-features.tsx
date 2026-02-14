"use client";

const features = [
  {
    title: "Smart OCR",
    description: "Automatically extract data from bank statements and receipts",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    title: "Auto-Categorization",
    description: "Intelligent categorization based on merchant and description",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  {
    title: "Bulk Import",
    description: "Process hundreds of transactions in seconds with AI",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
  },
];

export function AiProcessingFeatures() {
  return (
    <div className="rounded-xl bg-gradient-to-r from-accent to-pink-500 p-6 text-white">
      <h3 className="mb-4 text-lg font-semibold">AI-Powered Processing</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title} className="rounded-lg bg-white/10 p-4">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
              {feature.icon}
            </div>
            <h4 className="mb-1 font-semibold">{feature.title}</h4>
            <p className="text-sm opacity-90">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
