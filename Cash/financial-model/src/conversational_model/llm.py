# import json
# from typing import List, Dict, Any, Optional

# from dotenv import load_dotenv
# from langchain_google_genai import GoogleGenerativeAI, HarmCategory, HarmBlockThreshold
# from pydantic import BaseModel

# load_dotenv()  # Loads GOOGLE_API_KEY from .env

# class MessageAnalysis(BaseModel):
#     reply: str
#     intent: str

# async def LLM_response(
#     text: str,
#     history: List[Dict[str, str]] = None,
#     file_content_summary: Optional[str] = None,
# ) -> MessageAnalysis:
#     """
#     Strict finance-only assistant with conversation history and file awareness.
#     """
#     if history is None:
#         history = []

#     # Build conversation context
#     context = ""
#     for msg in history:
#         role = "User" if msg["role"] == "user" else "Assistant"
#         context += f"{role}: {msg['content']}\n\n"

#     # File context if present
#     file_info = ""
#     if file_content_summary:
#         file_info = f"\n\nUploaded file content summary:\n{file_content_summary}\n"

#     # Very strict system prompt
#     prompt = f"""You are Vault Finance Chat System — an EXPERT Indian personal finance assistant powered by strict rules.

# <ROLE>
# You exist ONLY to provide helpful, accurate, responsible advice about PERSONAL FINANCE in the Indian context.
# You NEVER answer anything outside this scope.
# </ROLE>

# <STRICT_RULES — YOU MUST FOLLOW ALL OF THESE OR YOU WILL BE SHUT DOWN>
# 1. Allowed topics ONLY:
#    - Budgeting, expense tracking, saving habits
#    - Debt management, loan repayment strategies
#    - Investment options: mutual funds, SIP, stocks, ETFs, gold, fixed deposits, PPF, NPS, ELSS, RD, bonds
#    - Tax planning (old vs new regime, 80C, 80D, HRA, capital gains)
#    - Retirement & long-term planning
#    - Insurance (term, health, ULIP vs pure term)
#    - Credit score improvement, credit card usage
#    - Analysis of uploaded financial documents (bank statements, expense sheets, investment portfolios)
#    - Basic financial math (compound interest, EMI, returns calculation)

# 2. For ANY question that is NOT clearly one of the above topics → you MUST return EXACTLY this JSON and NOTHING ELSE — no explanation, no apology, no extra sentence:
# {{
#   "reply": "I'm sorry, I can only help with personal finance topics in India (budgeting, investing, taxes, debt, savings, retirement, insurance). How can I assist you with your money matters today?",
#   "intent": "Non-finance Query"
# }}

# 3. Never break character. Never say "I can try", "maybe", "as an AI", "I'm not sure", "let me think".  
#    Either answer properly in finance domain or use the exact refusal JSON above.

# 4. Tone & style rules:
#    - Empathetic, calm, professional, non-judgmental
#    - Use simple language — avoid jargon unless explaining it
#    - Always include risk disclaimer when suggesting investments
#    - Recommend consulting a SEBI-registered advisor for personalized advice
#    - Use ₹ symbol and Indian numbering (lakhs, crores)

# 5. File analysis rules (when user uploads CSV/Excel/PDF):
#    - Focus ONLY on financial numbers: income, expenses, categories, trends, savings rate, debt-to-income, investment allocation
#    - Give actionable insights: highest expense category, potential savings, red flags
#    - If file appears non-financial or unreadable → use refusal JSON with message: "The uploaded file doesn't contain readable financial data."

# 6. Response format — ALWAYS return ONLY valid JSON. No extra text, no markdown, no comments:
# {{
#   "reply": "...",
#   "intent": "one of: Investment Advice, Debt Management, Budget Planning, Savings Strategy, Tax Planning, Retirement Planning, Insurance Advice, Financial Education, Non-finance Query, Help Request"
# }}
# </STRICT_RULES>

# Conversation history so far:
# {context}

# {file_info if file_content_summary else ""}

# Current user message: "{text}"

# Respond now. Return ONLY JSON.
# """

#     # Model initialization
#     vault_llm = GoogleGenerativeAI(
#         model="gemini-3-flash-preview",
#         temperature=0.35,
#         safety_settings={
#             HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
#             HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
#         }
#     )

#     # vault_llm = GoogleGenerativeAI(
#     #     model="gemini-3-flash-preview",           # ← 8b version is usually faster & cheaper
#     #     temperature=0.15,                      # ← much lower = less creative, more deterministic
#     #     top_p=0.85,
#     #     top_k=40,
#     #     max_output_tokens=600,                 # ← enough for good replies, not too long
#     #     safety_settings={
#     #         HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
#     #         HarmCategory.HARM_CATEGORY_HARASSMENT:        HarmBlockThreshold.BLOCK_NONE,
#     #         HarmCategory.HARM_CATEGORY_HATE_SPEECH:       HarmBlockThreshold.BLOCK_NONE,
#     #         HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
#     #     }
#     # )

#     try:
#         raw_response = vault_llm.invoke(prompt)
#         content = raw_response.content if hasattr(raw_response, 'content') else str(raw_response)

#         # Try direct JSON
#         data = json.loads(content.strip())

#     except json.JSONDecodeError:
#         # Fallback: extract JSON block
#         start = content.find("{")
#         end = content.rfind("}") + 1
#         if start != -1 and end > start:
#             try:
#                 data = json.loads(content[start:end])
#             except:
#                 data = {
#                     "reply": "I'm sorry, but I can only assist with finance-related questions. How can I help you with your money matters today?",
#                     "intent": "Non-finance Query"
#                 }
#         else:
#             data = {
#                 "reply": "I'm sorry, but I can only assist with finance-related questions. How can I help you with your money matters today?",
#                 "intent": "Non-finance Query"
#             }

#     except Exception as e:
#         data = {
#             "reply": f"Internal error: {str(e)}. Please try again.",
#             "intent": "Help Request"
#         }

#     try:
#         return MessageAnalysis(**data)
#     except:
#         return MessageAnalysis(
#             reply="I'm sorry, but I can only assist with finance-related questions. How can I help you with your money matters today?",
#             intent="Non-finance Query"
#         )
import json
import os
from typing import List, Dict, Any, Optional

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from pydantic import BaseModel

# removed dummy import

load_dotenv()

class MessageAnalysis(BaseModel):
    reply: str
    intent: str


async def fetch_wallet_summary(user_id: str, mode: str = "normal") -> Dict[str, Any]:
    """
    Fetch real summary from the Flask backend API.
    """
    import httpx
    try:
        # Flask backend is on port 5000
        backend_url = f"http://localhost:5000/api/dashboard/summary/{user_id}"
        is_super = str(mode).lower() == "super"
        
        print(f"DEBUG: Fetching wallet summary from {backend_url} (Super Mode: {is_super})")
        
        headers = {"X-Super-Mode": "true" if is_super else "false"}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(backend_url, headers=headers, timeout=5.0)
            if response.status_code == 200:
                summary = response.json()
                return {
                    "current_net_savings": summary.get("net_savings", 0),
                    "monthly_income": summary.get("total_income", 0),
                    "monthly_expenses": summary.get("total_expenses", 0),
                    "savings_rate_percent": summary.get("savings_rate", 0),
                    "currency": "INR",
                    "symbol": "₹",
                    "note": "Real-time summary from tracked transactions",
                    "last_updated": summary.get("month", "Current month")
                }
            else:
                print(f"DEBUG: Backend returned status {response.status_code}")
    except Exception as e:
        print(f"DEBUG: Error fetching summary: {e}")

    # Safe fallback if DB call fails
    return {
        "current_net_savings": 0,
        "monthly_income": 0,
        "monthly_expenses": 0,
        "savings_rate_percent": 0,
        "currency": "INR",
        "symbol": "₹",
        "note": "Could not connect to financial database",
        "last_updated": "N/A"
    }



SYSTEM_PROMPT = """You are CashMate — an EXPERT personal finance assistant.

<ROLE>
You exist ONLY to provide helpful, accurate, responsible advice about PERSONAL FINANCE.
You NEVER answer anything outside this scope.
</ROLE>

<STRICT_RULES — MUST FOLLOW ALL>
1. Allowed topics ONLY: budgeting, expense tracking, saving habits, debt management, investments (mutual funds, stocks, ETFs, bonds, fixed deposits, retirement accounts), tax planning, insurance, credit score, basic financial math.

2. For ANY question NOT clearly in the above topics → return EXACTLY this JSON and NOTHING ELSE:
{
  "reply": "I'm sorry, I can only help with personal finance questions (budgeting, saving, investing, debt, taxes, insurance, retirement). How can I assist you with your money matters today?",
  "intent": "Non-finance Query"
}

3. You are given the user's current financial summary at the start of every conversation. Use the EXACT numbers and currency shown. Do NOT invent or convert values.

   After using this information:
   - Use approximate language when helpful (around ₹3,200, approximately ₹4,300 this month)
   - ALWAYS add this disclaimer at the end when talking about savings, balance or investing:
     "This is not personalized financial advice. Consult a qualified financial advisor."

4. Tone: Empathetic, calm, professional, non-judgmental. Use simple language.

5. ALWAYS return ONLY valid JSON — nothing else:
{
  "reply": "your full answer here...",
  "intent": "Investment Advice | Debt Management | Budget Planning | Savings Strategy | Tax Planning | Retirement Planning | Insurance Advice | Financial Education | Non-finance Query | Help Request"
}
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

    # Fetch REAL summary from your database / API
    summary = await fetch_wallet_summary(user_id or "current_user", mode=mode)

    # Build summary text using real values
    summary_text = (
        f"Current financial summary (as of {summary['last_updated']}):\n"
        f"- Net savings: {summary['symbol']}{summary['current_net_savings']:,}\n"
        f"- Monthly income: {summary['symbol']}{summary['monthly_income']:,}\n"
        f"- Monthly expenses: {summary['symbol']}{summary['monthly_expenses']:,}\n"
        f"- Savings rate: {summary['savings_rate_percent']}%"
    )
    
    print(f"DEBUG: Injecting summary for AI: {summary_text}")

    messages = [SystemMessage(content=SYSTEM_PROMPT + "\n\n" + summary_text)]

    for msg in history:
        if msg["role"] == "user":
            messages.append(HumanMessage(content=msg["content"]))
        else:
            messages.append(AIMessage(content=msg["content"]))

    messages.append(HumanMessage(content=text))

    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        temperature=0.1,
        max_output_tokens=600,
    )

    try:
        response = await llm.ainvoke(messages)
        content = response.content.strip()
        print(f"DEBUG: AI raw content: {content}")
    except Exception as e:
        print(f"DEBUG: AI invocation error: {e}")
        content = ""

    if not content:
        content = json.dumps({
            "reply": (
                f"Your current net savings is {summary['symbol']}{summary['current_net_savings']:,}. "
                f"Monthly income is {summary['symbol']}{summary['monthly_income']:,} "
                f"and expenses are {summary['symbol']}{summary['monthly_expenses']:,} "
                f"(savings rate {summary['savings_rate_percent']}%).\n\n"
                "How else can I assist with your finances?"
            ),
            "intent": "Savings Strategy"
        })

    try:
        # Robust parsing: try to find the first '{' and last '}' if not directly valid
        start = content.find("{")
        end = content.rfind("}") + 1
        if start != -1 and end > start:
            json_str = content[start:end]
            data = json.loads(json_str)
        else:
            data = json.loads(content)
            
        if "reply" not in data or "intent" not in data:
            raise ValueError("Missing reply or intent fields")
    except Exception as e:
        print(f"DEBUG: JSON parse error: {e} for content: {content}")
        # Final fallback if parsing fails but we have content
        data = {
            "reply": content if len(content) > 10 else "I'm having trouble right now. Could you rephrase your question?",
            "intent": "Help Request"
        }

    return MessageAnalysis(**data)
