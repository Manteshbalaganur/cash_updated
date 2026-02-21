"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useUser } from "@/lib/user-context";
import { fetchWithAuth } from "@/lib/api-client";
import { PageHeader } from "@/components/shared/page-header";
import { ChatWindow } from "@/components/ai-assistant/chat-window";
import { ChatInput } from "@/components/ai-assistant/chat-input";
import { toast } from "sonner";

interface Message {
    id: string;
    role: "assistant" | "user";
    content: string;
    isStreaming?: boolean;
}

const initialMessages: Message[] = [
    {
        id: "1",
        role: "assistant",
        content:
            "Welcome to your Premium Investment Planner. I am **Dhan Saathi**, your personal Portfolio Manager. \n\nI've analyzed your current financial standing. My goal is to help you build a bulletproof investment strategy. \n\nWhat are your financial goals? (e.g., Buying a home, Retirement, or Wealth Creation)",
    },
];

export default function InvestmentPlannerPage() {
    const { userId } = useAuth();
    const { isSuper } = useUser();
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState("");
    const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected" | "error">("disconnected");
    const [isProcessing, setIsProcessing] = useState(false);
    const [summary, setSummary] = useState<any>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const currentMessageIdRef = useRef<string | null>(null);

    const wsUrl = "ws://localhost:8000/interact";

    useEffect(() => {
        async function loadStats() {
            if (!userId) return;
            try {
                const data = await fetchWithAuth("/api/dashboard/summary/{userId}", userId, {}, isSuper);
                setSummary(data);
            } catch (error) {
                console.error("Failed to load summary", error);
            }
        }
        loadStats();
    }, [userId, isSuper]);

    useEffect(() => {
        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    const connectWebSocket = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return wsRef.current;
        if (wsRef.current?.readyState === WebSocket.CONNECTING) return wsRef.current;

        setConnectionStatus("connecting");
        try {
            const ws = new WebSocket(wsUrl);
            ws.onopen = () => setConnectionStatus("connected");
            ws.onmessage = (event) => {
                let content = "";
                let isDone = false;

                if (event.data === "[DONE]" || event.data.includes("[DONE]")) {
                    isDone = true;
                } else {
                    try {
                        const data = JSON.parse(event.data);
                        content = data.content || data.text || data.message || data.reply || "";
                        if (data.done || data.status === "complete") isDone = true;
                    } catch {
                        content = event.data;
                    }
                }

                if (content && currentMessageIdRef.current) {
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === currentMessageIdRef.current
                                ? { ...msg, content: msg.content + content, isStreaming: !isDone }
                                : msg
                        )
                    );
                }

                if (isDone && currentMessageIdRef.current) {
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === currentMessageIdRef.current ? { ...msg, isStreaming: false } : msg
                        )
                    );
                    currentMessageIdRef.current = null;
                    setIsProcessing(false);
                }
            };
            ws.onerror = () => {
                setConnectionStatus("error");
                setIsProcessing(false);
            };
            ws.onclose = () => {
                setConnectionStatus("disconnected");
                wsRef.current = null;
            };
            wsRef.current = ws;
            return ws;
        } catch (error) {
            setConnectionStatus("error");
            setIsProcessing(false);
            return null;
        }
    };

    const handleSend = async (text: string) => {
        if (!text.trim() || isProcessing) return;
        setIsProcessing(true);

        const userMsg = { id: Date.now().toString(), role: "user" as const, content: text };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");

        const aiId = (Date.now() + 1).toString();
        setMessages((prev) => [...prev, { id: aiId, role: "assistant", content: "", isStreaming: true }]);
        currentMessageIdRef.current = aiId;

        const ws = connectWebSocket();
        const sendMessage = () => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ message: text, userId: userId || "guest", mode: "super" }));
            }
        };

        if (wsRef.current?.readyState === WebSocket.CONNECTING) {
            wsRef.current.addEventListener("open", sendMessage, { once: true });
        } else if (wsRef.current?.readyState === WebSocket.OPEN) {
            sendMessage();
        }
    };

    return (
        <div className="mx-auto max-w-7xl">
            <PageHeader
                title="Investment Planner"
                subtitle="Advanced portfolio management & wealth creation strategies"
            />

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                {/* Left Column: Context & Upload */}
                <div className="space-y-6 lg:col-span-4">
                    <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white shadow-lg">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Portfolio Status</h3>
                                <p className="text-xs text-white/70">Analysis powered by GPT-4</p>
                            </div>
                        </div>

                        {summary ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-lg bg-white/10 p-3 backdrop-blur-sm">
                                    <p className="text-[10px] uppercase tracking-wider text-white/60">Net Savings</p>
                                    <p className="text-lg font-bold">₹{summary.net_savings?.toLocaleString()}</p>
                                </div>
                                <div className="rounded-lg bg-white/10 p-3 backdrop-blur-sm">
                                    <p className="text-[10px] uppercase tracking-wider text-white/60">Savings Rate</p>
                                    <p className="text-lg font-bold">{summary.savings_rate}%</p>
                                </div>
                            </div>
                        ) : (
                            <div className="h-16 animate-pulse rounded-lg bg-white/10" />
                        )}

                        <div className="mt-4 border-t border-white/10 pt-4">
                            <p className="text-sm font-medium">Doctor's Observation:</p>
                            <p className="text-xs italic text-white/80 mt-1">
                                {summary?.savings_rate > 30
                                    ? "Strong surplus detected. You are ready for aggressive wealth creation plans."
                                    : "Surplus is moderate. Focus on high-yield debt reduction or liquid mutual funds first."}
                            </p>
                        </div>
                    </div>

                    {/* Prescription Section */}
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                <path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z" />
                            </svg>
                        </div>
                        <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">My Investment Roadmap</h4>

                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">1</div>
                                <div>
                                    <p className="text-xs font-bold text-foreground">Initial Assessment</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">Determine risk appetite and horizon.</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">2</div>
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground">Asset Allocation</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">Distribution between Equity/Debt/Gold.</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">3</div>
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground">Execution Strategy</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">Finalizing SIPs and lump sum entries.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                        <h4 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">Popular Planning Queries</h4>
                        <div className="space-y-2">
                            {[
                                "Create a retirement plan for age 50",
                                "How to invest ₹50,000 monthly?",
                                "Explain tax saving under 80C & 10(10D)",
                                "Compare Direct Equity vs Mutual Funds"
                            ].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => handleSend(s)}
                                    className="w-full rounded-xl border border-border px-4 py-3 text-left text-xs font-medium transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: AI Chat */}
                <div className="flex flex-col rounded-2xl border border-border bg-card shadow-sm lg:col-span-8" style={{ height: "calc(100vh - 220px)" }}>
                    <div className="border-b border-border bg-muted/30 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-3 w-3 animate-pulse rounded-full bg-green-500" />
                                <span className="text-sm font-bold text-foreground">Dhan Saathi (Portfolio AI)</span>
                            </div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase">Expert Mode Enabled</div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden p-4">
                        <ChatWindow messages={messages} connectionStatus={connectionStatus} />
                    </div>

                    <div className="border-t border-border p-4">
                        <ChatInput
                            value={input}
                            onChange={setInput}
                            onSend={() => handleSend(input)}
                            disabled={isProcessing}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
