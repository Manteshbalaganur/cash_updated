"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
}

interface ChatWindowProps {
  messages: Message[];
}

export function ChatWindow({ messages }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto rounded-xl border border-border bg-card p-4 shadow-sm">
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
              <p className="mb-1 text-xs font-semibold text-primary">AI Assistant</p>
            )}
            {msg.content}
          </div>
        ))}
      </div>
    </div>
  );
}
