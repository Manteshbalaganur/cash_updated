"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useUser } from "@/lib/user-context";
import { fetchWithAuth } from "@/lib/api-client";
import { PageHeader } from "@/components/shared/page-header";
import { ChatSuggestions } from "@/components/ai-assistant/chat-suggestions";
import { ChatWindow } from "@/components/ai-assistant/chat-window";
import { ChatInput } from "@/components/ai-assistant/chat-input";

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
      "Hello! I'm your AI finance assistant. I've analyzed your latest transaction data. How can I help you optimize your portfolio today?",
  },
];

export default function AiAssistantPage() {
  const { userId } = useAuth();
  const { isSuper } = useUser();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [walletContext, setWalletContext] = useState<any>(null);

  // Connection State
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Refs for managing WebSocket and Typewriter state
  const wsRef = useRef<WebSocket | null>(null);
  const targetContentRef = useRef("");     // The full content received from server
  const displayedContentRef = useRef("");  // The content currently shown on screen (lagging)
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);       // To track if we are currently in "typing loop"

  // Load initial context (keeping existing logic)
  useEffect(() => {
    async function loadAiContext() {
      if (!userId) return;
      try {
        const data = await fetchWithAuth("/api/ai-suggestions/{userId}", userId, {}, isSuper);
        if (data.suggestions) setSuggestions(data.suggestions);
        if (data.wallets) setWalletContext(data.wallets);
      } catch (error) {
        console.error("Failed to load AI suggestions", error);
        setSuggestions(["How can I check my total balance?", "What is my largest expense?", "Analyze my spending habits"]);
      }
    }
    loadAiContext();
  }, [userId, isSuper]);

  // WebSocket Connection Logic
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/chat";
    let socket: WebSocket;

    function connect() {
      console.log("Connecting to WebSocket:", wsUrl);
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log("WebSocket Connected");
        setIsConnected(true);
        setConnectionError(null);
      };

      socket.onmessage = (event) => {
        const chunk = event.data;
        // Append chunk to target buffer
        targetContentRef.current += chunk;

        // Ensure typewriter is running
        if (!isTypingRef.current) {
          startTypewriter();
        }
      };

      socket.onclose = () => {
        console.log("WebSocket Disconnected");
        setIsConnected(false);
        // Attempt reconnect after 3s
        setTimeout(() => connect(), 3000);
      };

      socket.onerror = (err) => {
        console.error("WebSocket Error:", err);
        setConnectionError("AI Unavailable (Connection Error)");
        setIsConnected(false);
      };

      wsRef.current = socket;
    }

    connect();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, []);

  // Typewriter Effect Loop
  const startTypewriter = () => {
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    isTypingRef.current = true;

    typingIntervalRef.current = setInterval(() => {
      const target = targetContentRef.current;
      const current = displayedContentRef.current;

      if (current.length < target.length) {
        // Calculate characters to add (adaptive speed: more chars if far behind)
        const lag = target.length - current.length;
        const charsToAdd = lag > 50 ? 5 : lag > 20 ? 3 : 1;

        const nextChunk = target.slice(current.length, current.length + charsToAdd);
        displayedContentRef.current += nextChunk;

        // Update the LAST message in the state
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg && lastMsg.role === "assistant" && lastMsg.isStreaming) {
            lastMsg.content = displayedContentRef.current;
            return newMessages;
          }
          return prev;
        });
      } else {
        // We caught up. If the socket request is "done" effectively, we might pause.
        // But for now, we just keep checking or pause if idle too long?
        // We'll just leave it running to catch new chunks immediately.
        // Optional: clearInterval if strict "done" signal exists.
      }
    }, 30); // 30ms update rate ~ 33fps
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert("AI is disconnected. Attempting to reconnect...");
      return;
    }

    // 1. Add User Message
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };

    // 2. Add Placeholder AI Message
    const aiPlaceholder: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "AI is typing...",
      isStreaming: true
    };

    setMessages((prev) => [...prev, userMsg, aiPlaceholder]);
    setInput("");

    // 3. Reset Buffers for new response
    targetContentRef.current = "";
    displayedContentRef.current = "";

    // 4. Send to Backend
    // Assuming backend takes raw string. If it needs JSON, use JSON.stringify({ message: text })
    try {
      wsRef.current.send(text);
    } catch (e) {
      console.error("Failed to send:", e);
    }
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col" style={{ height: "calc(100vh - 120px)" }}>
      <PageHeader
        title="AI Finance Assistant"
        subtitle="Get personalized financial insights and recommendations"
      />

      {/* Suggestions */}
      <ChatSuggestions suggestions={suggestions.length > 0 ? suggestions : ["Loading suggestions..."]} onSelect={handleSend} />

      {/* Chat Messages */}
      <ChatWindow messages={messages} />

      {/* Connection Status */}
      {connectionError && (
        <div className="px-4 py-2 text-center text-xs text-red-500">
          {connectionError} - Reconnecting...
        </div>
      )}

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
