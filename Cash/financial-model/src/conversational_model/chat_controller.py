from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
import asyncio
import json
from collections import defaultdict

from conversational_model.llm import LLM_response

cnv_router = APIRouter()

# In-memory history store: connection_id → list of {"role": str, "content": str}
history_store = defaultdict(list)

# ────────────────────────────────────────────────
# Modern UI (same as before, but included for completeness)
# ────────────────────────────────────────────────
html = """
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>FinanceAI - Your Money Assistant</title>
  
  <link href="https://cdn.jsdelivr.net/npm/daisyui@4.12.10/dist/full.min.css" rel="stylesheet" type="text/css" />
  <script src="https://cdn.tailwindcss.com"></script>

  <script>
    tailwind.config = {
      daisyui: { themes: ["light", "dark"] },
      theme: { extend: { colors: { primary: "#2563eb" } } }
    }
  </script>

  <style>
    .chat-bubble {
      max-width: 78%;
      padding: 14px 18px;
      border-radius: 20px;
      line-height: 1.5;
      font-size: 15px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .chat-start .chat-bubble { background: #f3f4f6; color: #111827; }
    .chat-end .chat-bubble { background: #dbeafe; color: #1e40af; }
    [data-theme="dark"] .chat-start .chat-bubble { background: #374151; color: #f3f4f6; }
    [data-theme="dark"] .chat-end .chat-bubble { background: #1e40af; color: #dbeafe; }
    .typing-dots span {
      width: 8px; height: 8px; background: currentColor; border-radius: 50%;
      animation: bounce 1.2s infinite; display: inline-block; margin: 0 2px;
    }
    .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
    .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce { 0%,80%,100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
  </style>
</head>
<body class="min-h-screen bg-base-200 flex flex-col">

  <div class="navbar bg-primary text-primary-content px-4 shadow">
    <div class="flex-1">
      <span class="text-xl font-bold">FinanceAI</span>
      <span class="ml-2 text-sm opacity-80">Personal Finance Assistant</span>
    </div>
    <div class="flex-none">
      <label class="swap swap-rotate">
        <input type="checkbox" class="theme-controller" value="dark" />
        <svg class="swap-on h-6 w-6 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5.64 17l-.71.71a1 1 0 000 1.41 1 1 0 001.41 0l.71-.71A1 1 0 005.64 17zM5 12a1 1 0 00-1-1H3a1 1 0 000 2h1a1 1 0 001-1zm7-7a1 1 0 001-1V3a1 1 0 00-2 0v1a1 1 0 001 1z"/></svg>
        <svg class="swap-off h-6 w-6 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21.64 13a1 1 0 00-1.05-.14 8.05 8.05 0 01-3.37.73A8.15 8.15 0 019.08 5.49a8.59 8.59 0 01.25-2A1 1 0 008 2.36 10.14 10.14 0 1022 14.05 1 1 0 0021.64 13z"/></svg>
      </label>
    </div>
  </div>

  <div class="flex flex-1 overflow-hidden">

    <!-- Sidebar (small) -->
    <div class="w-80 bg-base-100 border-r border-base-300 p-5 flex flex-col gap-5 hidden lg:flex">
      <div class="card bg-base-200 shadow-sm">
        <div class="card-body p-5">
          <h3 class="card-title text-lg">Upload Document</h3>
          <p class="text-sm opacity-70 mb-3">CSV, PDF • Max 10 MB</p>
          <div class="border-2 border-dashed border-base-300 rounded-xl p-6 text-center hover:border-primary transition-colors">
            <div class="text-4xl mb-3 opacity-70">↑</div>
            <p class="font-medium mb-1">Drop file here</p>
            <p class="text-sm opacity-60 mb-3">or</p>
            <button class="btn btn-sm btn-outline">Browse files</button>
          </div>
          <div class="mt-4 text-xs opacity-60">
            Your data is used only for financial insights.<br>We prioritize privacy.
          </div>
        </div>
      </div>
      <select class="select select-bordered w-full">
        <option selected>English</option>
        <option>Hindi</option>
      </select>
    </div>

    <!-- Chat area -->
    <div class="flex-1 flex flex-col">
      <div class="flex-1 overflow-y-auto p-4 md:p-6 space-y-6" id="messages">
        <!-- Welcome -->
        <div class="chat chat-start">
          <div class="chat-image avatar">
            <div class="w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl">F</div>
          </div>
          <div class="chat-header opacity-70 text-xs mb-1">FinanceAI</div>
          <div class="chat-bubble">
            Hello! I'm your personal finance assistant.<br>Ask me anything about budgeting, investments, taxes, debt, savings, or mutual funds.
          </div>
        </div>
      </div>

      <div class="p-4 border-t border-base-300 bg-base-100">
        <form id="chatForm" class="max-w-4xl mx-auto flex gap-3">
          <input type="text" id="messageText" placeholder="Ask anything about money, investments, taxes..." class="input input-bordered flex-1 focus:input-primary" autocomplete="off"/>
          <button type="submit" class="btn btn-primary px-8">Send</button>
        </form>
      </div>
    </div>
  </div>

  <script>
    const messages = document.getElementById('messages');
    const form = document.getElementById('chatForm');
    const input = document.getElementById('messageText');
    let ws = null;

    function addMessage(sender, text, isUser = false) {
      const div = document.createElement('div');
      div.className = `chat ${isUser ? 'chat-end' : 'chat-start'}`;
      if (!isUser) {
        const avatar = document.createElement('div');
        avatar.className = 'chat-image avatar';
        avatar.innerHTML = '<div class="w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl">F</div>';
        div.appendChild(avatar);
      }
      const bubble = document.createElement('div');
      bubble.className = `chat-bubble ${isUser ? 'chat-bubble-primary' : ''}`;
      bubble.textContent = text;
      div.appendChild(bubble);
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    function showTyping() {
      const typing = document.createElement('div');
      typing.className = 'chat chat-start';
      typing.id = 'typing';
      typing.innerHTML = `
        <div class="chat-image avatar"><div class="w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl">F</div></div>
        <div class="chat-bubble"><span class="typing-dots"><span></span><span></span><span></span></span> Thinking...</div>
      `;
      messages.appendChild(typing);
      messages.scrollTop = messages.scrollHeight;
    }

    function removeTyping() {
      document.getElementById('typing')?.remove();
    }

    function connectWS() {
      ws = new WebSocket(`ws://${location.host}/interact`);
      ws.onopen = () => console.log('Connected');
      ws.onmessage = (e) => {
        removeTyping();
        addMessage('Bot', e.data);
      };
      ws.onclose = () => setTimeout(connectWS, 2000);
    }

    form.onsubmit = (e) => {
      e.preventDefault();
      const msg = input.value.trim();
      if (!msg) return;
      addMessage('You', msg, true);
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(msg);
        showTyping();
      }
      input.value = '';
      input.focus();
    };

    connectWS();
  </script>
</body>
</html>
"""
@cnv_router.get("/chat")
async def get_chat_page():
    return HTMLResponse(content=html)

# @cnv_router.websocket("/interact")
# async def websocket_endpoint(websocket: WebSocket):
#     await websocket.accept()
#     conn_id = id(websocket)

#     try:
#         while True:
#             try:
#                 message = await websocket.receive()
#             except WebSocketDisconnect:
#                 break

#             if "text" in message:
#                 text = message["text"].strip()
#                 if not text:
#                     continue

#                 # Add to history
#                 history_store[conn_id].append({"role": "user", "content": text})

#                 # Keep last 10 messages
#                 recent_history = history_store[conn_id][-10:]

#                 try:
#                     # Call LLM (file_content_summary can be added later)
#                     result = await LLM_response(text, recent_history)
#                     reply = f"{result.reply} | intent: {result.intent}"

#                     # Save assistant reply
#                     history_store[conn_id].append({"role": "assistant", "content": reply})

#                     await websocket.send_text(reply)

#                 except Exception as e:
#                     await websocket.send_text(f"Error: {str(e)}")

#             # Future: handle binary file uploads
#             elif "bytes" in message:
#                 await websocket.send_text("File received (binary data). Name pending...")

#     except Exception as e:
#         print(f"WebSocket error: {e}")
#     finally:
#         history_store.pop(conn_id, None)
#         try:
#             await websocket.close()
#         except:
#             pass
# chatcontrollers.py  (only showing the changed part)

# from fastapi import WebSocket, WebSocketDisconnect, Query

# @cnv_router.websocket("/interact")
# async def websocket_endpoint(
#     websocket: WebSocket
# ):
#     await websocket.accept()
#     conn_id = id(websocket)

#     print(f"WebSocket opened — connection_id = {conn_id}")

#     try:
#         while True:
#             try:
#                 # Receive message (it can be text or JSON string)
#                 message = await websocket.receive_text()
#             except WebSocketDisconnect:
#                 break

#             if not message:
#                 continue

#             print(f"DEBUG: Received raw message: {message[:100]}")

#             # Default values

#             text = message
#             user_id = "guest"
#             mode = "normal"

#             # Try to parse as JSON if it looks like JSON
#             if message.strip().startswith("{") and message.strip().endswith("}"):
#                 try:
#                     data = json.loads(message)
#                     text = data.get("message", text)
#                     user_id = data.get("userId", user_id)
#                     mode = data.get("mode", mode)
#                 except json.JSONDecodeError:
#                     pass

#             print(f"Processing message for user {user_id}: {text[:50]}...")

#             history_store[conn_id].append({"role": "user", "content": text})
#             recent_history = history_store[conn_id][-10:]

#             try:
#                 # Call LLM_response with the correct user_id and mode
#                 result = await LLM_response(
#                     text=text,
#                     history=recent_history,
#                     user_id=user_id,
#                     mode=mode,
#                 )
                
#                 reply = result.reply

#                 history_store[conn_id].append({"role": "assistant", "content": reply})
                
#                 # Send back the reply as JSON or text
#                 # Frontend expects either plain text (which it handles) or JSON
#                 await websocket.send_text(reply)
                
#             except Exception as e:
#                 print(f"Error in LLM_response: {e}")
#                 await websocket.send_text(f"Sorry, I encountered an error: {str(e)}")

#     except Exception as e:
#         print(f"WS error: {e}")
#     finally:
#         history_store.pop(conn_id, None)
#         try:
#             await websocket.close()
#         except:
#             pass
import json
from fastapi import WebSocket, WebSocketDisconnect, Query
from typing import Dict, Any

# Already defined in this file:
# cnv_router = APIRouter()
# history_store = defaultdict(list)


@cnv_router.websocket("/interact")
async def websocket_endpoint(
    websocket: WebSocket,
    # Optional: you can also accept user_id via query param for extra security
    # user_id: str = Query(default=None, alias="uid")
):
    await websocket.accept()
    conn_id = id(websocket)

    print(f"[WS] Connection opened — conn_id = {conn_id}")

    try:
        while True:
            try:
                raw_message = await websocket.receive_text()
            except WebSocketDisconnect:
                print(f"[WS] Client disconnected — conn_id = {conn_id}")
                break
            except Exception as e:
                print(f"[WS] Receive error: {e}")
                break

            if not raw_message.strip():
                continue

            print(f"[WS] ← Received: {raw_message[:120]}{'...' if len(raw_message) > 120 else ''}")

            # Default fallback values
            text = ""
            user_id = "guest_anonymous"
            mode = "normal"

            # Try to parse as JSON (what your React frontend sends)
            try:
                data_json: Dict[str, Any] = json.loads(raw_message)
                text = str(data_json.get("message", "")).strip()
                user_id = str(data_json.get("userId", user_id)).strip()
                mode = str(data_json.get("mode", mode)).strip().lower()

                # Optional: extra validation
                if not text:
                    await websocket.send_text("No message content received.")
                    continue

            except json.JSONDecodeError:
                # If not JSON, treat as plain text message
                text = raw_message.strip()

            if not text:
                continue

            print(f"[WS] Processing → user_id={user_id} | mode={mode} | text={text[:60]}...")

            # Store user message in history
            history_store[conn_id].append({"role": "user", "content": text})
            recent_history = history_store[conn_id][-12:]  # keep last 12 messages

            try:
                # Call your LLM function — must accept mode parameter!
                result = await LLM_response(
                    text=text,
                    history=recent_history,
                    user_id=user_id,
                    mode=mode,                    # ← now passed correctly
                    # file_content_summary=...    # add if you support file uploads later
                )

                # Diagnostics 
                print(f"[WS] reply_type: {type(result.reply)}")
                
                reply = result.reply
                if isinstance(reply, list):
                    reply_text = " ".join([str(r) for r in reply]).strip()
                else:
                    reply_text = str(reply).strip()

                # Store assistant reply
                history_store[conn_id].append({"role": "assistant", "content": reply_text})

                # Send back plain text reply
                await websocket.send_text(reply_text)

                print(f"[WS] → Sent reply (len={len(reply_text)})")

            except Exception as e:
                error_msg = f"Sorry, something went wrong on our side: {str(e)}"
                print(f"[WS] LLM error: {e}")
                await websocket.send_text(error_msg)

    except Exception as e:
        print(f"[WS] General WebSocket error: {e}")
    finally:
        history_store.pop(conn_id, None)
        try:
            await websocket.close()
        except:
            pass

    print(f"[WS] Connection closed — conn_id = {conn_id}")