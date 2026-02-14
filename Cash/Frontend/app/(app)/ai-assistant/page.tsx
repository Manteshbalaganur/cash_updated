"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { ChatSuggestions } from "@/components/ai-assistant/chat-suggestions";
import { ChatWindow } from "@/components/ai-assistant/chat-window";
import { ChatInput } from "@/components/ai-assistant/chat-input";
import { normalChatSuggestions } from "@/lib/mock-data";

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Hello! I'm your AI finance assistant. I can help you understand your spending patterns, suggest savings strategies, and recommend investments tailored to your goals. How can I help you today?",
  },
];

// Mock AI responses keyed by suggestion text
const mockResponses: Record<string, string> = {
  "Where am I overspending?":
    "Based on your recent transactions, your Food category spending is 15% above your 6-month average. Restaurant visits account for most of this increase. Consider meal prepping to save $200-300/month.",
  "How can I save more?":
    "Here are 3 quick wins: 1) Switch to a no-fee bank account (saves $15/mo). 2) Cancel unused subscriptions I found ($45/mo). 3) Set up automatic transfers of $500/mo to your Emergency Fund.",
  "Which investment suits me and why?":
    "Given your moderate risk profile and 5+ year horizon, I recommend a mix of Large Cap Index Funds (60%) and Government Bonds (40%). This balances growth with stability while keeping fees low.",
  "What's my financial health score?":
    "Your Financial Health Score is 8.4/10 (Excellent). Strengths: Strong savings rate (36.2%), low debt-to-income. Area to improve: Emergency fund covers only 2.8 months - aim for 6 months.",
  "Should I increase my emergency fund?":
    "Yes! Your emergency fund currently covers 2.8 months of expenses. The recommended target is 6 months ($32,520). I suggest transferring $500/month from your Normal Wallet to reach this goal in 35 months.",
};

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      const response = mockResponses[text] ||
        "That's a great question! Based on your financial data, I'd recommend reviewing your monthly budget and focusing on building your emergency fund. Would you like me to create a detailed savings plan?";
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: response };
      setMessages((prev) => [...prev, aiMsg]);
    }, 800);
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col" style={{ height: "calc(100vh - 120px)" }}>
      <PageHeader
        title="AI Finance Assistant"
        subtitle="Get personalized financial insights and recommendations"
      />

      {/* Suggestions */}
      <ChatSuggestions suggestions={normalChatSuggestions} onSelect={handleSend} />

      {/* Chat Messages */}
      <ChatWindow messages={messages} />

      {/* Input */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={() => handleSend(input)}
      />

      <p className="mt-2 text-center text-xs text-muted-foreground">
        Powered by AI + MCP - Context-aware financial intelligence
      </p>
    </div>
  );
}
