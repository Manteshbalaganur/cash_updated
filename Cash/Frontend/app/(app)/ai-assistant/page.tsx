// "use client";

// import { useState, useEffect, useRef } from "react";
// import { useAuth } from "@clerk/nextjs";
// import { useUser } from "@/lib/user-context";
// import { fetchWithAuth } from "@/lib/api-client";
// import { PageHeader } from "@/components/shared/page-header";
// import { ChatSuggestions } from "@/components/ai-assistant/chat-suggestions";
// import { ChatWindow } from "@/components/ai-assistant/chat-window";
// import { ChatInput } from "@/components/ai-assistant/chat-input";

// interface Message {
//   id: string;
//   role: "assistant" | "user";
//   content: string;
//   isStreaming?: boolean;
// }

// const initialMessages: Message[] = [
//   {
//     id: "1",
//     role: "assistant",
//     content:
//       "Hello! I'm your AI finance assistant. I've analyzed your latest transaction data. How can I help you optimize your portfolio today?",
//   },
// ];

// export default function AiAssistantPage() {
//   const { userId } = useAuth();
//   const { isSuper } = useUser();
//   const [messages, setMessages] = useState<Message[]>(initialMessages);
//   const [input, setInput] = useState("");
//   const [suggestions, setSuggestions] = useState<string[]>([]);
//   const [walletContext, setWalletContext] = useState<any>(null);
//   const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected" | "error">("disconnected");

//   const wsRef = useRef<WebSocket | null>(null);
//   const typewriterIntervalRef = useRef<NodeJS.Timeout | null>(null);
//   const pendingChunksRef = useRef<string>("");
//   const displayedLengthRef = useRef<number>(0);
//   const currentMessageIdRef = useRef<string | null>(null);

//   // IMPORTANT: Your backend works on /interact, not /chat
//   const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/interact";

//   useEffect(() => {
//     async function loadAiContext() {
//       if (!userId) return;
//       try {
//         const data = await fetchWithAuth("/api/ai-suggestions/{userId}", userId, {}, isSuper);
//         if (data.suggestions) setSuggestions(data.suggestions);
//         if (data.wallets) setWalletContext(data.wallets);
//       } catch (error) {
//         console.error("Failed to load AI suggestions", error);
//         setSuggestions([
//           "Where am I overspending?",
//           "How can I save more?",
//           "Which investment suits me and why?",
//           "What's my financial health score?",
//         ]);
//       }
//     }
//     loadAiContext();
//   }, [userId, isSuper]);

//   // Typewriter: gradually show characters
//   const startTypewriter = () => {
//     if (typewriterIntervalRef.current) return;
//     if (!currentMessageIdRef.current) return;

//     const delay = 40; // ms per character
//     const step = 2;   // chars per tick

//     typewriterIntervalRef.current = setInterval(() => {
//       const pending = pendingChunksRef.current;
//       const shown = displayedLengthRef.current;

//       if (shown >= pending.length) return; // wait for more

//       const next = Math.min(shown + step, pending.length);
//       const visible = pending.substring(0, next);

//       displayedLengthRef.current = next;

//       setMessages((prev) =>
//         prev.map((msg) =>
//           msg.id === currentMessageIdRef.current
//             ? { ...msg, content: visible, isStreaming: true }
//             : msg
//         )
//       );
//     }, delay);
//   };

//   const stopTypewriter = (finalize = false) => {
//     if (typewriterIntervalRef.current) {
//       clearInterval(typewriterIntervalRef.current);
//       typewriterIntervalRef.current = null;
//     }

//     if (finalize && currentMessageIdRef.current) {
//       setMessages((prev) =>
//         prev.map((msg) =>
//           msg.id === currentMessageIdRef.current
//             ? { ...msg, content: pendingChunksRef.current, isStreaming: false }
//             : msg
//         )
//       );
//       pendingChunksRef.current = "";
//       displayedLengthRef.current = 0;
//       currentMessageIdRef.current = null;
//     }
//   };

//   useEffect(() => {
//     return () => {
//       stopTypewriter();
//       wsRef.current?.close();
//     };
//   }, []);

//   const connectWebSocket = () => {
//     if (wsRef.current?.readyState === WebSocket.OPEN) return;

//     setConnectionStatus("connecting");
//     const ws = new WebSocket(wsUrl);

//     ws.onopen = () => {
//       console.log("WS connected to:", wsUrl);
//       setConnectionStatus("connected");
//       wsRef.current = ws;
//     };

//     ws.onmessage = (event) => {
//       console.log("RAW FROM SERVER:", event.data); // ← Debug: see exactly what arrives

//       let chunk = "";

//       try {
//         const data = JSON.parse(event.data);
//         chunk = data.content || data.text || data.message || data.reply || "";
//         console.log("Parsed chunk:", chunk);
//       } catch {
//         chunk = event.data; // plain text fallback
//         console.log("Plain text:", chunk);
//       }

//       if (chunk && currentMessageIdRef.current) {
//         pendingChunksRef.current += chunk;

//         if (!typewriterIntervalRef.current) {
//           startTypewriter();
//         }
//       }
//       ////
//       // Fake typewriter for full responses
// if (chunk.length > 30 && pendingChunksRef.current === chunk) {
//   console.log("Full answer received - faking typewriter");
//   const words = chunk.split(/(\s+)/);
//   let i = 0;

//   const fakeType = setInterval(() => {
//     if (i >= words.length) {
//       clearInterval(fakeType);
//       setTimeout(() => stopTypewriter(true), 300);
//       return;
//     }

//     pendingChunksRef.current += words[i];
//     i++;

//     if (!typewriterIntervalRef.current) {
//       startTypewriter();
//     }
//   }, 60); // 60ms per word — adjust to taste
// }

//       // End detection (adjust if your server sends "done")
//       if (
//         event.data.includes("done") ||
//         event.data.includes("finished") ||
//         event.data.includes("[DONE]") ||
//         event.data.includes("END")
//       ) {
//         setTimeout(() => stopTypewriter(true), 500);
//       }
//     };

//     ws.onerror = (err) => {
//       console.error("WS error:", err);
//       setConnectionStatus("error");
//     };

//     ws.onclose = () => {
//       console.log("WS closed");
//       setConnectionStatus("disconnected");
//       wsRef.current = null;
//       setTimeout(connectWebSocket, 3000); // reconnect
//     };
//   };

//   const handleSend = (text: string) => {
//     if (!text.trim()) return;

//     const userMsg = {
//       id: Date.now().toString(),
//       role: "user" as const,
//       content: text,
//     };

//     setMessages((prev) => [...prev, userMsg]);
//     setInput("");

//     // AI placeholder
//     const aiId = (Date.now() + 1).toString();
//     setMessages((prev) => [
//       ...prev,
//       { id: aiId, role: "assistant", content: "", isStreaming: true },
//     ]);

//     currentMessageIdRef.current = aiId;
//     pendingChunksRef.current = "";
//     displayedLengthRef.current = 0;

//     connectWebSocket();

//     const send = () => {
//       if (wsRef.current?.readyState === WebSocket.OPEN) {
//         wsRef.current.send(
//           JSON.stringify({
//             message: text,
//             userId: userId || "guest",
//             mode: isSuper ? "super" : "normal",
//           })
//         );
//         console.log("Sent:", text);
//       }
//     };

//     if (wsRef.current?.readyState === WebSocket.CONNECTING) {
//       wsRef.current.addEventListener("open", send, { once: true });
//     } else {
//       send();
//     }
//   };

//   return (
//     <div className="mx-auto flex max-w-4xl flex-col" style={{ height: "calc(100vh - 120px)" }}>
//       <PageHeader
//         title="AI Finance Assistant"
//         subtitle="Get personalized financial insights and recommendations"
//       />

//       <ChatSuggestions
//         suggestions={
//           suggestions.length > 0
//             ? suggestions
//             : ["Loading suggestions..."]
//         }
//         onSelect={handleSend}
//       />

//       <ChatWindow
//         messages={messages}
//         connectionStatus={connectionStatus}
//       />

//       <ChatInput
//         value={input}
//         onChange={setInput}
//         onSend={() => handleSend(input)}
//       />

//       <p className="mt-2 text-center text-xs text-muted-foreground">
//         Powered by AI + MCP - Context-aware financial intelligence
//       </p>
//     </div>
//   );
// }

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);

  useEffect(() => {
    if (isSuper) {
      router.replace("/investment-planner");
    }
  }, [isSuper, router]);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected" | "error">("disconnected");
  const [isProcessing, setIsProcessing] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const currentMessageIdRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // FIXED: Correct WebSocket URL - your backend runs on port 8000 with /interact endpoint
  const wsUrl = "ws://localhost:8000/interact"; // Hardcode for now to test
  // in your chat page/component

  // const { userId } = useAuth();
  // const wsUrl = new WebSocket(`ws://localhost:8000/interact?user_id=${userId || 'anonymous'}`);

  useEffect(() => {
    async function loadAiContext() {
      if (!userId) return;
      try {
        const data = await fetchWithAuth("/api/ai-suggestions/{userId}", userId, {}, isSuper);
        if (data.suggestions) setSuggestions(data.suggestions);
      } catch (error) {
        console.error("Failed to load AI suggestions", error);
        setSuggestions([
          "Where am I overspending?",
          "How can I save more?",
          "Which investment suits me and why?",
          "What's my financial health score?",
        ]);
      }
    }
    loadAiContext();
  }, [userId, isSuper]);

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    // Don't try to connect if already connected or connecting
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return wsRef.current;
    }

    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      return wsRef.current;
    }

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionStatus("connecting");
    console.log("Attempting to connect to:", wsUrl);

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("✅ WS connected successfully to:", wsUrl);
        setConnectionStatus("connected");
        wsRef.current = ws;
      };

      ws.onmessage = (event) => {
        console.log("📩 RAW FROM SERVER:", event.data);

        let content = "";
        let isDone = false;

        // Check if this is a completion message
        if (event.data === "[DONE]" || event.data.includes("[DONE]")) {
          isDone = true;
        } else {
          try {
            const data = JSON.parse(event.data);
            content = data.content || data.text || data.message || data.reply || "";

            // Check for done flag
            if (data.done || data.status === "complete") {
              isDone = true;
            }
          } catch {
            content = event.data; // plain text fallback
          }
        }

        if (content && currentMessageIdRef.current) {
          // Update message immediately with full content
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === currentMessageIdRef.current
                ? {
                  ...msg,
                  content: msg.content + content,
                  isStreaming: !isDone
                }
                : msg
            )
          );
        }

        // Handle completion
        if (isDone && currentMessageIdRef.current) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === currentMessageIdRef.current
                ? { ...msg, isStreaming: false }
                : msg
            )
          );

          currentMessageIdRef.current = null;
          setIsProcessing(false);
        }
      };

      ws.onerror = (err) => {
        console.error("❌ WS error:", err);
        setConnectionStatus("error");

        // Show error in the UI
        if (currentMessageIdRef.current) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === currentMessageIdRef.current
                ? { ...msg, content: "Connection failed. Please check if backend is running on port 8000.", isStreaming: false }
                : msg
            )
          );
          currentMessageIdRef.current = null;
        }
        setIsProcessing(false);
      };

      ws.onclose = (event) => {
        console.log("🔌 WS closed:", event.code, event.reason);
        setConnectionStatus("disconnected");
        wsRef.current = null;

        // Don't reconnect automatically on error, let user retry
        if (event.code !== 1000 && currentMessageIdRef.current) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === currentMessageIdRef.current
                ? { ...msg, content: "Connection lost. Please try again.", isStreaming: false }
                : msg
            )
          );
          currentMessageIdRef.current = null;
          setIsProcessing(false);
        }
      };

      return ws;
    } catch (error) {
      console.error("❌ Failed to create WebSocket:", error);
      setConnectionStatus("error");
      setIsProcessing(false);
      return null;
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || isProcessing) return;

    setIsProcessing(true);

    // Add user message
    const userMsg = {
      id: Date.now().toString(),
      role: "user" as const,
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Create AI message placeholder
    const aiId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: aiId, role: "assistant", content: "", isStreaming: true },
    ]);

    currentMessageIdRef.current = aiId;

    // Connect and send
    const ws = connectWebSocket();

    const sendMessage = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const payload = {
          message: text,
          userId: userId || "guest",
          mode: isSuper ? "super" : "normal",
        };
        console.log("📤 Sending:", payload);
        wsRef.current.send(JSON.stringify(payload));
      } else {
        console.error("❌ WebSocket not open, state:", wsRef.current?.readyState);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiId
              ? { ...msg, content: "Failed to connect. Make sure your backend is running on port 8000.", isStreaming: false }
              : msg
          )
        );
        currentMessageIdRef.current = null;
        setIsProcessing(false);
      }
    };

    // Wait for connection if needed
    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      wsRef.current.addEventListener("open", sendMessage, { once: true });
    } else if (wsRef.current?.readyState === WebSocket.OPEN) {
      sendMessage();
    } else {
      // If connection failed immediately
      setTimeout(() => {
        if (currentMessageIdRef.current === aiId) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiId
                ? { ...msg, content: "Could not connect to AI service. Please check if backend is running.", isStreaming: false }
                : msg
            )
          );
          currentMessageIdRef.current = null;
          setIsProcessing(false);
        }
      }, 2000);
    }
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col" style={{ height: "calc(100vh - 120px)" }}>
      <PageHeader
        title="AI Finance Assistant"
        subtitle="Get personalized financial insights and recommendations"
      />

      <ChatSuggestions
        suggestions={
          suggestions.length > 0
            ? suggestions
            : ["Loading suggestions..."]
        }
        onSelect={handleSend}
      />

      <ChatWindow
        messages={messages}
        connectionStatus={connectionStatus}
      />

      <ChatInput
        value={input}
        onChange={setInput}
        onSend={() => handleSend(input)}
        disabled={isProcessing}
      />

      <p className="mt-2 text-center text-xs text-muted-foreground">
        Powered by AI + MCP - Context-aware financial intelligence
      </p>
    </div>
  );
}