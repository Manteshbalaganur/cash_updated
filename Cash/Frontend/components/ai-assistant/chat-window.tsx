"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  isStreaming?: boolean;
  isTyping?: boolean;
}

interface ChatWindowProps {
  messages: Message[];
  connectionStatus?: "connected" | "connecting" | "disconnected" | "error";
}

export function ChatWindow({ messages, connectionStatus = "connected" }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom on new messages or streaming updates
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const TypingIndicator = () => (
    <div className="flex items-center gap-1">
      <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]"></span>
      <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]"></span>
      <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground"></span>
    </div>
  );

  const ConnectionStatusBadge = () => {
    if (connectionStatus === "connected") return null;

    const statusConfig = {
      connecting: { text: "Connecting...", className: "text-yellow-500" },
      disconnected: { text: "Reconnecting...", className: "text-yellow-500" },
      error: { text: "AI unavailable", className: "text-red-500" },
    };

    const config = statusConfig[connectionStatus];
    return (
      <div className={cn("mb-2 text-center text-xs", config.className)}>
        {config.text}
      </div>
    );
  };

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto rounded-xl border border-border bg-card p-4 shadow-sm">
      <ConnectionStatusBadge />
      <div className="flex flex-col gap-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed",
              msg.role === "assistant"
                ? "self-start bg-muted text-foreground"
                : "self-end bg-primary text-primary-foreground"
            )}
          >
            {msg.role === "assistant" && (
              <p className="mb-1 text-xs font-semibold text-primary">Dhan Saathi</p>
            )}
            {msg.isTyping ? (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">AI is typing</span>
                <TypingIndicator />
              </div>
            ) : (
              <>
                {msg.content}
                {msg.isStreaming && (
                  <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-current"></span>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
