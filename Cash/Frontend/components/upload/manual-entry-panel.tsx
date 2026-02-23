"use client";

import React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { addExpense } from "@/lib/api-client";

interface ManualEntryPanelProps {
  entries: {
    date: string;
    name: string;
    amount: string;
    category: string;
    type: "expense" | "income";
  }[];
  onAddEntry: (entry: {
    date: string;
    name: string;
    amount: string;
    category: string;
    type: "expense" | "income";
  }) => void;
}

export function ManualEntryPanel({ entries, onAddEntry }: ManualEntryPanelProps) {
  const { userId } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [type, setType] = useState<"debit" | "credit">("debit");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error("Please log in to add transactions");
      return;
    }

    if (description && amount && category) {
      try {
        setSubmitting(true);
        await addExpense({
          clerk_user_id: userId,
          date,
          description,
          amount: parseFloat(amount),
          category,
          type
        });

        toast.success("Transaction added!");

        // Reset form
        setDescription("");
        setAmount("");
        setShowForm(false);

        // Notify others to refresh
        window.dispatchEvent(new Event("transaction-added"));
      } catch (error: any) {
        toast.error(error.message || "Failed to add transaction");
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Manual Entry</h3>
        <Button
          onClick={() => setShowForm(!showForm)}
          size="sm"
          className="bg-green-600 text-white hover:bg-green-700"
        >
          {showForm ? "Close Form" : "+ Add Transaction"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 flex flex-col gap-3 rounded-lg border border-border bg-muted/50 p-5">
          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tx-date">Date</Label>
            <Input
              id="tx-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tx-name">Description</Label>
            <Input
              id="tx-name"
              placeholder="e.g., Grocery Store, Salary"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tx-amount">Amount</Label>
            <Input
              id="tx-amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tx-category">Category</Label>
            <select
              id="tx-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="Food">Food</option>
              <option value="Transport">Transport</option>
              <option value="Shopping">Shopping</option>
              <option value="Bills">Bills & Utilities</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Health">Health</option>
              <option value="Salary">Salary</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Type: Expense / Income */}
          <div className="flex flex-col gap-1.5">
            <Label>Transaction Type</Label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  checked={type === "debit"}
                  onChange={() => setType("debit")}
                />
                Expense (Debit)
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  checked={type === "credit"}
                  onChange={() => setType("credit")}
                />
                Income (Credit)
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-2">
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {submitting ? "Saving..." : "Save Transaction"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-border text-muted-foreground">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">No manual entries yet</p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-2 rounded-lg border border-green-500 px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-50"
          >
            Add Your First Transaction
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((entry, i) => (
            <div
              key={`${entry.name}-${entry.date}-${i}`}
              className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{entry.name}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.date} • {entry.category}
                </p>
              </div>
              <span
                className={`text-sm font-semibold ${entry.type === "expense" ? "text-red-500" : "text-green-500"
                  }`}
              >
                {entry.type === "expense" ? "-" : "+"}₹{entry.amount}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}