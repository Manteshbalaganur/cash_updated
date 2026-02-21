import json
import os
import httpx
import asyncio
import re
from typing import List, Dict, Any, Optional

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage, SystemMessage
from pydantic import BaseModel

load_dotenv()

class MessageAnalysis(BaseModel):
    reply: str
    intent: str

# ────────────────────────────────────────────────
#  Tool - fetch current financial summary
# ────────────────────────────────────────────────
@tool
async def fetch_wallet_summary(user_id: str, is_super: bool = False) -> Dict[str, Any]:
    """
    Retrieve the current financial state for this user.
    Contains total net worth (total assets minus total liabilities), 
    plus monthly income/expense breakdowns.
    Use this tool ALWAYS when users ask about their balance, savings, 
    risk capacity, or if they can afford an investment.
    """
    try:
        # Backend URLs
        summary_url = f"http://localhost:5000/api/dashboard/summary/{user_id}"
        wallets_url = f"http://localhost:5000/api/wallets/{user_id}"
        liabilities_url = f"http://localhost:5000/api/liabilities/{user_id}"
        
        headers = {"X-Super-Mode": "true" if is_super else "false"}
        print(f"DEBUG: Tool fetching comprehensive summary for {user_id} (Super: {is_super})")
        
        async with httpx.AsyncClient() as client:
            # Fetch all required data in parallel
            tasks = [
                client.get(summary_url, headers=headers),
                client.get(wallets_url, headers=headers),
                client.get(liabilities_url, headers=headers)
            ]
            responses = await asyncio.gather(*tasks)
            
            summary = responses[0].json() if responses[0].status_code == 200 else {}
            wallets = responses[1].json() if responses[1].status_code == 200 else {}
            liabilities = responses[2].json() if responses[2].status_code == 200 else {}
            
            # TOTAL ASSETS (lifetime)
            total_assets = (wallets.get("normal", 0) + 
                            wallets.get("cashback", 0) + 
                            wallets.get("emergency", 0))
            
            # TOTAL LIABILITIES (lifetime)
            total_liabilities = liabilities.get("total", 0)
            
            # TOTAL NET WORTH (This is what the user usually means by 'balance')
            net_worth = total_assets - total_liabilities
            
            result = {
                "currency": "INR",
                "total_net_worth": round(net_worth, 2),
                "total_assets": round(total_assets, 2),
                "total_liabilities": round(total_liabilities, 2),
                "monthly_net_savings": summary.get("net_savings", 0),
                "monthly_income": summary.get("total_income", 0),
                "monthly_expenses": summary.get("total_expenses", 0),
                "savings_rate_percent": summary.get("savings_rate", 0),
                "month": summary.get("month", "Current Month"),
                "status": "success"
            }
            print(f"DEBUG: Tool final result: {result}")
            return result
            
    except Exception as e:
        print(f"DEBUG: Tool error: {e}")
        return {"error": f"Could not fetch data: {str(e)}", "total_net_worth": 0}

tools = [fetch_wallet_summary]

# ────────────────────────────────────────────────
#   MAIN SYSTEM PROMPT
# ────────────────────────────────────────────────
SYSTEM_PROMPT = """You are Dhan Saathi — a helpful and friendly Indian personal finance assistant (Doctor of Money).

You help users track expenses, budget, save, and invest specifically in the Indian market.

CRITICAL RULES:
1. For ANY question about the user's balance, savings, income, net worth, or money, you MUST use `fetch_wallet_summary`.
2. Report the `total_net_worth` from the tool as their "Total Balance" or "Net Worth". 
3. If the tool returns a non-zero number (e.g., 10999), you MUST NOT say "you have 0". 
4. Monthly data (income/expense) should be used for budgeting advice.
5. Use ₹ symbol and Indian number system (Lakhs, Crores).
6. ALWAYS return valid JSON format.
"""

async def LLM_response(
    text: str,
    history: List[Dict[str, str]] = None,
    user_id: str = None,
    mode: str = "normal",
    file_content_summary: Optional[str] = None,
) -> MessageAnalysis:
    if history is None:
        history = []

    if not user_id:
        return MessageAnalysis(
            reply="I need your user ID to access your financial data.",
            intent="Help Request"
        )

    # Build messages
    messages = [SystemMessage(content=SYSTEM_PROMPT)]

    # Limit history to top 5 for token/quota efficiency
    for msg in history[-5:]:
        if msg["role"] == "user":
            messages.append(HumanMessage(content=msg["content"]))
        else:
            messages.append(AIMessage(content=msg["content"]))

    messages.append(HumanMessage(content=text))

    # Model setup - Using the user's preferred model
    try:
        try:
            current_model = "gemini-2.0-flash-exp"
            llm = ChatGoogleGenerativeAI(
                model=current_model,
                temperature=0.2,
                max_output_tokens=800,
            )
            llm_with_tools = llm.bind_tools(tools)
            
            # Initial pass
            response = await llm_with_tools.ainvoke(messages)
        except Exception as e:
            print(f"WARN: Primary model '{current_model}' failed ({e}). Using separate fallback 1.5-flash-8b...")
            llm = ChatGoogleGenerativeAI(
                model="gemini-1.5-flash-8b", 
                temperature=0.2,
                max_output_tokens=800,
            )
            llm_with_tools = llm.bind_tools(tools)
            response = await llm_with_tools.ainvoke(messages)

        # Handle tool calls (This now runs regardless of which model was used)
        if hasattr(response, "tool_calls") and response.tool_calls:
            messages.append(response) 
            for tool_call in response.tool_calls:
                if tool_call["name"] == "fetch_wallet_summary":
                    args = tool_call.get("args", {})
                    if "user_id" not in args: args["user_id"] = user_id
                    
                    # Ensure is_super flag is explicitly passed to the tool
                    is_super = (mode == "super")
                    
                    summary_result = await fetch_wallet_summary.ainvoke({
                        **args,
                        "is_super": is_super
                    })
                    messages.append(ToolMessage(
                        content=json.dumps(summary_result),
                        tool_call_id=tool_call["id"]
                    ))

            # Second pass after tool calling
            response = await llm_with_tools.ainvoke(messages)

        # Safely extract text from potentially multi-part content
        raw_content = response.content
        if isinstance(raw_content, list):
            content = "".join([c if isinstance(c, str) else (c.get("text", "") if isinstance(c, dict) else str(c)) for c in raw_content])
        else:
            content = str(raw_content)

        # Robust cleaning and parsing
        content = content.strip()
        
        # 1. Try to find JSON block with regex
        json_match = re.search(r'\{(?:[^{}]|(?R))*\}', content, re.DOTALL)
        if json_match:
            try:
                data = json.loads(json_match.group())
            except json.JSONDecodeError:
                # Fallback: simple cleanup of markdown
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()
                try:
                    data = json.loads(content)
                except:
                    data = {"reply": content, "intent": "General"}
        else:
            # No JSON found, wrap raw content
            data = {"reply": content, "intent": "General"}
        
        # Final type safety for reply
        reply = data.get("reply", "I processed your request but had a formatting issue.")
        if isinstance(reply, list):
            reply = " ".join([str(r) for r in reply])
        
        return MessageAnalysis(
            reply=str(reply),
            intent=str(data.get("intent", "Assistant"))
        )
    except Exception as e:
        print(f"CRITICAL LLM ERROR: {type(e).__name__} - {str(e)}")
        return MessageAnalysis(
            reply="Dhan Saathi is momentarily unavailable. (Error: check server logs)",
            intent="Help Request"
        )
