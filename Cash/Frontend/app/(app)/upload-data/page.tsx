"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { FileUploadZone } from "@/components/upload/file-upload-zone";
import { ManualEntryPanel } from "@/components/upload/manual-entry-panel";
import { AiProcessingFeatures } from "@/components/upload/ai-processing-features";

export default function UploadDataPage() {
  const [manualEntries, setManualEntries] = useState<{ name: string; amount: string; category: string }[]>([]);

  const handleAddEntry = (entry: { name: string; amount: string; category: string }) => {
    setManualEntries((prev) => [...prev, entry]);
  };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Data Upload & Entry" subtitle="Add transactions manually or upload documents for AI processing" />

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FileUploadZone />
        <ManualEntryPanel entries={manualEntries} onAddEntry={handleAddEntry} />
      </div>

      <AiProcessingFeatures />
    </div>
  );
}
