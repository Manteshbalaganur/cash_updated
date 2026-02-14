"use client";

import { useState, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { uploadFile } from "@/lib/api-client";
import { toast } from "sonner";

export function FileUploadZone() {
  const { userId } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const performUpload = async (file: File) => {
    if (!userId) {
      toast.error("You must be logged in to upload files.");
      return;
    }

    try {
      setUploading(true);
      setFileName(file.name);
      await uploadFile(file, userId);
      toast.success("File processed successfully!");
      // Optionally trigger a refresh of other components
      window.dispatchEvent(new Event("transaction-added"));
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) performUpload(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) performUpload(file);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-1 text-lg font-semibold text-foreground">Upload Documents</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Upload CSV files or bank statements (PDF) for automatic processing
      </p>

      {/* Drop Zone */}
      <div
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-border"
          } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`mb-3 text-primary ${uploading ? "animate-bounce" : ""}`}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        {uploading ? (
          <p className="text-sm font-medium text-foreground italic">Processing {fileName}...</p>
        ) : fileName ? (
          <p className="text-sm font-medium text-foreground">{fileName}</p>
        ) : (
          <>
            <p className="text-sm text-foreground">Drop files here or click to browse</p>
            <p className="mt-1 text-xs text-muted-foreground">Supports CSV, Excel, PDF, Images</p>
          </>
        )}
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:bg-muted"
        >
          {uploading ? "Uploading..." : "Choose File"}
        </button>
        <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls,.pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
      </div>

      {/* Supported Types */}
      <div className="mt-4 flex gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <div>
            <p className="font-medium text-foreground">CSV Files</p>
            <p className="text-xs">Transaction exports</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <div>
            <p className="font-medium text-foreground">PDF & Images</p>
            <p className="text-xs">Bank statements</p>
          </div>
        </div>
      </div>
    </div>
  );
}
