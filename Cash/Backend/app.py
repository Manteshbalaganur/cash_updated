from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import os
import re
import io
import numpy as np
import pandas as pd
from PIL import Image
import pdfplumber
try:
    from pdf2image import convert_from_bytes
except ImportError:
    print("WARNING: pdf2image not installed. PDF scanning will be limited.")
    convert_from_bytes = None
try:
    import cv2
except ImportError:
    print("WARNING: opencv-python-headless not installed. Image processing might be limited.")

# Single unified database
from database import db, transactions

print(f">>> STARTUP: Backend script starting at {datetime.now()}")

# ---------------- APP INIT ----------------
app = Flask(__name__)
# Simplified CORS to avoid conflicts
CORS(app, resources={r"/api/*": {"origins": "*"}})
# or for dev only: CORS(app)  # allows all origins (less secure, ok for local)

@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({
        "status": "ok",
        "message": "Backend connected! Ready for frontend calls.",
        "date": "2026-02-14"
    })

# ---------------- GLOBAL ERROR HANDLER ----------------
@app.errorhandler(Exception)
def handle_exception(e):
    # Pass through HTTP errors
    from werkzeug.exceptions import HTTPException
    if isinstance(e, HTTPException):
        return e
    
    # Handle non-HTTP exceptions
    print(f"CRITICAL ERROR: {str(e)}")
    import traceback
    traceback.print_exc()
    return jsonify({"error": str(e)}), 500
# ---------------- AI LOGIC ----------------
def generate_ai_suggestions(wallets):
    suggestions = []

    total = wallets["normal"] + wallets["cashback"] + wallets["emergency"]
    if total <= 0:
        return ["Not enough data to generate insights"]

    emergency_ratio = (wallets["emergency"] / total) * 100

    if emergency_ratio < 20:
        suggestions.append("Emergency fund is low. Try saving at least 20%.")

    if wallets["normal"] < 0:
        suggestions.append("Overspending detected. Reduce non-essential expenses.")

    if wallets["cashback"] > wallets["normal"] * 0.3:
        suggestions.append("Good cashback usage. Redirect cashback to savings.")

    return suggestions


# ---------------- HOME ----------------
@app.route("/")
def home():
    return "Backend running successfully"


# ---------------- ADD MANUAL EXPENSE ----------------
@app.route("/api/add-expense", methods=["POST", "GET"])
@app.route("/api/add_expense", methods=["POST", "GET"])
def add_expense():
    if request.method == "GET":
        return jsonify({"message": "Endpoint is working. Use POST to add data."})
    print(">>> CRITICAL DEBUG: add_expense endpoint HIT!")
    try:
        data = request.get_json()
        print(f"DEBUG: Received request data: {data}")

        required = ["clerk_user_id", "amount", "category", "type"]
        if not data or not all(k in data for k in required):
            return jsonify({"error": "Missing fields"}), 400

        # Clean amount string if it's not a number
        amount_val = data["amount"]
        if isinstance(amount_val, str):
            amount_val = re.sub(r'[^\d.]', '', amount_val)
            amount_val = float(amount_val) if amount_val else 0.0

        record = {
            "clerk_user_id": data["clerk_user_id"],
            "date": data.get("date") or datetime.utcnow().strftime("%Y-%m-%d"),
            "description": data.get("description", ""),
            "amount": float(amount_val),
            "category": data["category"],
            "type": data["type"],
            "created_at": datetime.utcnow()
        }

        print(f"DEBUG: Inserting record into MongoDB: {record}")
        # Always insert into unified transactions collection
        transactions.insert_one(record)

        return jsonify({"message": "Expense added successfully", "status": "success"})

    except Exception as e:
        print(f"ERROR in add_expense: {str(e)}")
        return jsonify({"error": str(e)}), 500


# ---------------- CSV UPLOAD ----------------
# ---------------- OCR & PARSING HELPERS ----------------
ocr_reader = None

def get_ocr_reader():
    global ocr_reader
    if ocr_reader is None:
        try:
            import easyocr
            print("DEBUG: Initializing EasyOCR Reader (English)...")
            ocr_reader = easyocr.Reader(['en'])
        except Exception as e:
            print(f"ERROR: Could not initialize easyocr: {e}")
            return None
    return ocr_reader

def clean_amount(val):
    if pd.isna(val) or val == "": return 0.0
    if isinstance(val, (int, float)): return float(val)
    # Remove currency symbols and non-numeric chars except . and ,
    cleaned = re.sub(r'[^\d.,-]', '', str(val))
    if not cleaned: return 0.0
    # Handle European/Indian formatting if comma is used as decimal
    if ',' in cleaned and '.' in cleaned:
        cleaned = cleaned.replace(',', '') # remove thousands
    elif ',' in cleaned and '.' not in cleaned:
        # Check if it looks like a decimal separator (e.g. 100,50)
        parts = cleaned.split(',')
        if len(parts[-1]) == 2:
            cleaned = cleaned.replace(',', '.')
        else:
            cleaned = cleaned.replace(',', '')
    try:
        return float(cleaned)
    except:
        return 0.0

def parse_text_blob(text, clerk_user_id):
    """Fallback logic to extract transactions from a block of text via regex"""
    lines = text.split('\n')
    records = []
    
    # Regex patterns
    date_pattern = r'(\d{1,4}[-/]\d{1,2}[-/]\d{1,4})'
    amount_pattern = r'([+-]?\s*₹?\s*[\d,]+\.?\d*)'
    
    print(f"DEBUG: Parsing text blob ({len(text)} chars)...")

    for line in lines:
        line = line.strip()
        if not line: continue
        
        dates = re.findall(date_pattern, line)
        amounts = re.findall(amount_pattern, line)
        
        if dates and amounts:
            # Clean the first amount found
            amt_str = amounts[0]
            amount = clean_amount(amt_str)
            
            # Simple description: everything between date and amount
            desc = line
            for d in dates: desc = desc.replace(d, "")
            for a in amounts: desc = desc.replace(a, "")
            desc = desc.strip(" -|:₹")
            
            # Determine type
            tx_type = "debit"
            if amount < 0:
                tx_type = "debit"
                amount = abs(amount)
            elif "credit" in line.lower() or "cr" in line.lower().split() or "income" in line.lower() or "salary" in line.lower():
                tx_type = "credit"
            elif "debit" in line.lower() or "dr" in line.lower().split() or "expense" in line.lower():
                tx_type = "debit"
            
            # Category guessing
            category = "Other"
            low_line = line.lower()
            if any(w in low_line for w in ["swiggy", "zomato", "food", "restaurant", "eat"]): category = "Food"
            elif any(w in low_line for w in ["uber", "ola", "travel", "flight", "petrol", "fuel"]): category = "Transport"
            elif any(w in low_line for w in ["amazon", "flipkart", "shopping", "myntra"]): category = "Shopping"
            elif any(w in low_line for w in ["netflix", "hotstar", "movie", "spotify"]): category = "Entertainment"
            
            records.append({
                "clerk_user_id": clerk_user_id,
                "date": dates[0],
                "description": desc[:100],
                "amount": amount,
                "category": category,
                "type": tx_type,
                "created_at": datetime.utcnow()
            })
            
    return records

# ---------------- ROBUST FILE UPLOAD ----------------
@app.route("/api/upload", methods=["POST"])
def upload_file():
    print(">>> API CALL: /api/upload (POST)")
    try:
        # 1. Validate Request
        clerk_user_id = request.form.get("clerk_user_id")
        file = request.files.get("file")
        
        if not clerk_user_id:
            print("ERROR: Missing clerk_user_id")
            return jsonify({"error": "User ID is required"}), 400
        if not file:
            print("ERROR: Missing file")
            return jsonify({"error": "No file uploaded"}), 400

        filename = file.filename
        ext = filename.lower().split('.')[-1]
        print(f"DEBUG: Processing upload -> File: {filename}, Ext: {ext}, User: {clerk_user_id}")
        
        # 2. Supported Extensions Check (Case Insensitive)
        allowed_extensions = {'csv', 'xlsx', 'xls', 'pdf', 'jpg', 'jpeg', 'png'}
        if ext not in allowed_extensions:
            return jsonify({"error": f"Unsupported file type: .{ext}"}), 400

        records = []
        errors = []
        file_bytes = file.read()
        file.seek(0) # Reset pointer
        
        # ---------------------------------------------------------
        # 3. FILE PROCESSING LOGIC
        # ---------------------------------------------------------

        # CAS 1: EXCEL / CSV
        if ext in ['csv', 'xlsx', 'xls']:
            try:
                print(f"DEBUG: Reading tabular data for {ext}...")
                df = None
                if ext == 'csv':
                    df = pd.read_csv(io.BytesIO(file_bytes))
                else:
                    # engine='openpyxl' for xlsx, default for xls
                    engine = 'openpyxl' if ext == 'xlsx' else None
                    df = pd.read_excel(io.BytesIO(file_bytes), engine=engine)
                
                print(f"DEBUG: DataFrame loaded. Rows: {len(df)}, Columns: {list(df.columns)}")
                
                # Normalize columns
                df.columns = [str(c).lower().strip() for c in df.columns]
                
                # Dynamic Column Mapping
                col_map = {
                    "date": next((c for c in df.columns if any(x in c for x in ["date", "time"])), None),
                    "description": next((c for c in df.columns if any(x in c for x in ["desc", "detail", "particular", "narr", "remark"])), None),
                    "amount": next((c for c in df.columns if any(x in c for x in ["amt", "amount", "value", "debit", "credit"])), None),
                    "category": next((c for c in df.columns if "cat" in c), None),
                    "type": next((c for c in df.columns if any(x in c for x in ["type", "dr/cr"])), None)
                }
                
                print(f"DEBUG: Column Mapping found: {col_map}")

                if not col_map["amount"]:
                     # Fallback specific logic for bank statements sometimes having 'Debit' and 'Credit' columns separate
                    debit_col = next((c for c in df.columns if "debit" in c or "dr" in c), None)
                    credit_col = next((c for c in df.columns if "credit" in c or "cr" in c), None)
                    
                    if debit_col or credit_col:
                        print(f"DEBUG: Found separate Debit/Credit columns: {debit_col}, {credit_col}")
                        # We will handle row by row
                    else:
                        return jsonify({"error": "Could not identify Amount column. Please check headers."}), 400

                for idx, row in df.iterrows():
                    try:
                        # Date
                        raw_date = row.get(col_map["date"])
                        tx_date = str(raw_date) if raw_date else datetime.now().strftime("%Y-%m-%d")
                        
                        # Amount & Type Logic
                        amount = 0.0
                        tx_type = "debit"
                        
                        # If we have a single amount column
                        if col_map["amount"]:
                            raw_amt = row.get(col_map["amount"], 0)
                            amount = clean_amount(raw_amt)
                            
                            # Determine type from column or sign
                            if col_map["type"]:
                                type_val = str(row.get(col_map["type"], "")).lower()
                                if type_val in ["credit", "cr", "income", "deposit"]:
                                    tx_type = "credit"
                                elif type_val in ["debit", "dr", "withdrawal"]:
                                    tx_type = "debit"
                            
                            # Fallback: if negative amount, it's usually debit (or already signed)
                            if amount < 0:
                                tx_type = "debit"
                                amount = abs(amount) # Store absolute value
                            
                        # If we have separate Debit/Credit columns
                        else:
                            debit_val = clean_amount(row.get(next((c for c in df.columns if "debit" in c or "withdraw" in c), None), 0))
                            credit_val = clean_amount(row.get(next((c for c in df.columns if "credit" in c or "deposit" in c), None), 0))
                            
                            if credit_val > 0:
                                amount = credit_val
                                tx_type = "credit"
                            elif debit_val > 0:
                                amount = debit_val
                                tx_type = "debit"
                        
                        if amount == 0: continue # Skip empty rows

                        # Description
                        desc = str(row.get(col_map["description"], "Bulk Import"))
                        if desc == "nan": desc = "Bulk Import"

                        # Category
                        cat = str(row.get(col_map["category"], "Uncategorized"))
                        if cat == "nan" or not cat: 
                            # Basic Keyword matching for category
                            desc_lower = desc.lower()
                            if any(x in desc_lower for x in ['zomato', 'swiggy', 'food', 'restaurant']): cat = 'Food'
                            elif any(x in desc_lower for x in ['uber', 'ola', 'petrol', 'fuel']): cat = 'Transport'
                            elif any(x in desc_lower for x in ['amazon', 'flipkart', 'shopping']): cat = 'Shopping'
                            elif any(x in desc_lower for x in ['salary', 'interest', 'refund']): cat = 'Income' if tx_type == 'credit' else 'Other'
                            else: cat = 'Other'

                        records.append({
                            "clerk_user_id": clerk_user_id,
                            "date": tx_date,
                            "description": desc[:100],
                            "amount": float(amount),
                            "category": cat,
                            "type": tx_type,
                            "created_at": datetime.utcnow()
                        })
                        
                    except Exception as row_err:
                        print(f"WARN: Error parsing row {idx}: {row_err}")
                        continue

            except Exception as e:
                print(f"ERROR processing {ext}: {e}")
                errors.append(f"Failed to parse {ext}: {str(e)}")

        # CAS 2: PDF
        elif ext == 'pdf':
            print("DEBUG: Processing PDF...")
            raw_text = ""
            try:
                # 1. Try Digital Text Extraction (Tables & Text)
                with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                    for page in pdf.pages:
                        # Extract tables
                        tables = page.extract_tables()
                        if tables:
                            for table in tables:
                                # Convert table rows to text lines
                                for row in table:
                                    # Filter None values
                                    clean_row = [str(cell) if cell else "" for cell in row]
                                    raw_text += " ".join(clean_row) + "\n"
                        
                        # Extract Free Text
                        text = page.extract_text()
                        if text:
                            raw_text += text + "\n"
                
                print(f"DEBUG: Extracted {len(raw_text)} chars via pdfplumber.")

                # 2. OCR Fallback (if text is too short, likely a scanned PDF)
                if len(raw_text.strip()) < 50:
                    if convert_from_bytes:
                        print("DEBUG: Low text count. Attempting OCR on PDF...")
                        try:
                            images = convert_from_bytes(file_bytes)
                            reader = get_ocr_reader()
                            if reader:
                                for img in images:
                                    results = reader.readtext(np.array(img))
                                    for res in results:
                                        raw_text += res[1] + " "
                                    raw_text += "\n"
                        except Exception as ocr_err:
                            print(f"WARN: OCR failed on PDF: {ocr_err}")
                            errors.append("OCR processing failed (dependency missing?)")
                    else:
                        print("WARN: skipping OCR, convert_from_bytes not available")

                # Parse the Blob
                parsed_records = parse_text_blob(raw_text, clerk_user_id)
                records.extend(parsed_records)

            except Exception as e:
                print(f"ERROR parsing PDF: {e}")
                errors.append(f"PDF Error: {str(e)}")

        # CAS 3: IMAGES
        elif ext in ['jpg', 'jpeg', 'png']:
            print(f"DEBUG: Processing Image {ext}...")
            try:
                reader = get_ocr_reader()
                if reader:
                    image = Image.open(io.BytesIO(file_bytes))
                    results = reader.readtext(np.array(image))
                    
                    raw_text = ""
                    for res in results:
                        raw_text += res[1] + "\n"
                    
                    print(f"DEBUG: OCR Text extracted: {len(raw_text)} chars")
                    parsed_records = parse_text_blob(raw_text, clerk_user_id)
                    records.extend(parsed_records)
                else:
                    errors.append("OCR engine could not initialize.")
            except Exception as e:
                print(f"ERROR processing image: {e}")
                errors.append(f"Image Error: {str(e)}")

        # ---------------------------------------------------------
        # 4. DATABASE INSERTION (MongoDB)
        # ---------------------------------------------------------
        inserted_count = 0
        if records:
            result = transactions.insert_many(records)
            inserted_count = len(result.inserted_ids)
            print(f"DEBUG: Successfully inserted {inserted_count} records into MongoDB.")
        else:
            print("DEBUG: No valid records parsed.")

        response = {
            "message": "Success" if not errors else "Partial Success",
            "records": inserted_count,
            "errors": errors,
            "details": f"Parsed {inserted_count} transactions from {filename}"
        }
        
        return jsonify(response), 200

    except Exception as e:
        print(f"CRITIAL UPLOAD ERROR: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ---------------- GET TRANSACTIONS ----------------
@app.route("/api/transactions/<clerk_user_id>", methods=["GET"])
@app.route("/api/get_transactions/<clerk_user_id>", methods=["GET"])
def get_transactions(clerk_user_id):
    try:
        # Super user can pass ?all=true to see all users' transactions
        show_all = request.args.get('all', 'false').lower() == 'true'
        is_super = request.headers.get('X-Super-Mode', 'false').lower() == 'true'
        
        if show_all and is_super:
            # Admin view: return all transactions
            query = {}
        else:
            # Normal view: only this user's transactions
            query = {"clerk_user_id": clerk_user_id}
        
        data = list(
            transactions.find(query, {"_id": 0}).sort("created_at", -1).limit(20)
        )
        return jsonify(data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------- WALLET SUMMARY ----------------
@app.route("/api/wallets/<clerk_user_id>", methods=["GET"])
def wallet_summary(clerk_user_id):
    try:
        pipeline = [
            {"$match": {"clerk_user_id": clerk_user_id}},
            {"$group": {
                "_id": "$category",
                "total": {
                    "$sum": {
                        "$cond": [
                            {"$eq": ["$type", "credit"]},
                            "$amount",
                            {"$multiply": ["$amount", -1]}
                        ]
                    }
                }
            }}
        ]

        result = transactions.aggregate(pipeline)

        wallets = {
            "normal": 0,
            "cashback": 0,
            "emergency": 0
        }

        for r in result:
            category = str(r["_id"]).lower() if r["_id"] else ""
            if "cashback" in category:
                wallets["cashback"] += r["total"]
            elif "emergency" in category:
                wallets["emergency"] += r["total"]
            else:
                wallets["normal"] += r["total"]

        print(f"DEBUG: Wallets for {clerk_user_id}:", wallets)

        return jsonify(wallets)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------- AI SUGGESTIONS ----------------
@app.route("/api/ai-suggestions/<clerk_user_id>", methods=["GET"])
@app.route("/api/ai_suggestions/<clerk_user_id>", methods=["GET"])
def ai_suggestions(clerk_user_id):
    try:
        pipeline = [
            {"$match": {"clerk_user_id": clerk_user_id}},
            {"$group": {
                "_id": "$category",
                "total": {
                    "$sum": {
                        "$cond": [
                            {"$eq": ["$type", "credit"]},
                            "$amount",
                            {"$multiply": ["$amount", -1]}
                        ]
                    }
                }
            }}
        ]

        result = transactions.aggregate(pipeline)

        wallets = {
            "normal": 0,
            "cashback": 0,
            "emergency": 0
        }

        for r in result:
            category = str(r["_id"]).lower() if r["_id"] else ""
            if "cashback" in category:
                wallets["cashback"] += r["total"]
            elif "emergency" in category:
                wallets["emergency"] += r["total"]
            else:
                wallets["normal"] += r["total"]

        suggestions = generate_ai_suggestions(wallets)

        return jsonify({
            "wallets": wallets,
            "suggestions": suggestions
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------- DASHBOARD SUMMARY ----------------
@app.route("/api/dashboard/summary/<clerk_user_id>", methods=["GET"])
def dashboard_summary(clerk_user_id):
    try:
        now = datetime.utcnow()
        current_month = now.month
        current_year = now.year
        
        # Helper to get monthly totals
        def get_monthly_totals(year, month):
            month_str = f"{year}-{month:02d}"
            
            pipeline = [
                {"$match": {
                    "clerk_user_id": clerk_user_id,
                    "date": {"$regex": f"^{month_str}"}
                }},
                {"$group": {
                    "_id": "$type",
                    "total": {"$sum": "$amount"}
                }}
            ]
            
            result = list(transactions.aggregate(pipeline))
            income = 0
            expenses = 0
            
            for r in result:
                if r["_id"] == "credit":
                    income = r["total"]
                elif r["_id"] == "debit":
                    expenses = r["total"]
            
            return income, expenses

        # Current month totals
        curr_income, curr_expenses = get_monthly_totals(current_year, current_month)
        net_savings = curr_income - curr_expenses
        savings_rate = (net_savings / curr_income * 100) if curr_income > 0 else 0

        summary = {
            "total_income": round(curr_income, 2),
            "total_expenses": round(curr_expenses, 2),
            "net_savings": round(net_savings, 2),
            "savings_rate": round(savings_rate, 1),
            "month": now.strftime("%B %Y"),
            "trends": {
                "income": {"direction": "up", "percentage": 0},
                "expenses": {"direction": "up", "percentage": 0}
            }
        }
        
        return jsonify(summary)

    except Exception as e:
        print(f"ERROR in dashboard_summary: {str(e)}")
        return jsonify({"error": str(e)}), 500


# ---------------- DASHBOARD MONTHLY SUMMARY ----------------
@app.route("/api/dashboard/monthly-summary/<clerk_user_id>", methods=["GET"])
def monthly_summary(clerk_user_id):
    try:
        now = datetime.utcnow()
        current_month_str = now.strftime("%Y-%m")
        
        # Calculate previous month for comparison
        prev_month = now.month - 1
        prev_year = now.year
        if prev_month == 0:
            prev_month = 12
            prev_year -= 1
        prev_month_str = f"{prev_year}-{prev_month:02d}"

        def get_stats(month_query):
            pipeline = [
                {"$match": {
                    "clerk_user_id": clerk_user_id,
                    "date": {"$regex": f"^{month_query}"}
                }},
                {"$group": {
                    "_id": "$type",
                    "total": {"$sum": "$amount"}
                }}
            ]
            result = list(transactions.aggregate(pipeline))
            income = 0
            expenses = 0
            for r in result:
                if r["_id"] == "credit":
                    income = r["total"]
                elif r["_id"] == "debit":
                    expenses = r["total"]
            return income, expenses

        curr_income, curr_expenses = get_stats(current_month_str)
        prev_income, prev_expenses = get_stats(prev_month_str)

        net_savings = curr_income - curr_expenses
        savings_rate = (net_savings / curr_income * 100) if curr_income > 0 else 0

        # Calculate percentage changes
        def get_change(curr, prev):
            if prev == 0:
                return 100.0 if curr > 0 else 0.0
            return ((curr - prev) / prev) * 100

        income_change = get_change(curr_income, prev_income)
        expenses_change = get_change(curr_expenses, prev_expenses)

        summary = {
            "monthly_income": round(curr_income, 2),
            "monthly_expenses": round(curr_expenses, 2),
            "net_savings": round(net_savings, 2),
            "savings_rate": round(savings_rate, 1),
            "income_change_percent": round(income_change, 1),
            "expenses_change_percent": round(expenses_change, 1),
            "month_name": now.strftime("%B %Y")
        }

        # print(f"DEBUG: Monthly Summary for {clerk_user_id}:", summary)
        return jsonify(summary)

    except Exception as e:
        print(f"ERROR in monthly_summary: {str(e)}")
        return jsonify({"error": str(e)}), 500


# ---------------- DASHBOARD ANALYTICS ----------------
@app.route("/api/dashboard/analytics/<clerk_user_id>", methods=["GET"])
def dashboard_analytics(clerk_user_id):
    """Get analytics data for dashboard charts"""
    try:
        from datetime import datetime, timedelta
        from collections import defaultdict
        
        # Get this user's transactions from unified collection
        all_transactions = list(transactions.find({"clerk_user_id": clerk_user_id}))
        
        # Calculate expense by category (for pie chart)
        expense_by_category = defaultdict(float)
        for tx in all_transactions:
            if tx.get("type") == "debit":
                category = tx.get("category", "Other")
                expense_by_category[category] += tx.get("amount", 0)
        
        # Convert to list format with colors
        category_colors = {
            "Food": "#ef4444",
            "Transport": "#f59e0b",
            "Shopping": "#8b5cf6",
            "Entertainment": "#ec4899",
            "Utilities": "#06b6d4",
            "Emergency": "#dc2626",
            "Other": "#6b7280"
        }
        
        expenses_by_category = [
            {
                "name": cat,
                "value": round(amount, 2),
                "color": category_colors.get(cat, "#6b7280")
            }
            for cat, amount in sorted(expense_by_category.items(), key=lambda x: x[1], reverse=True)
        ]
        
        # Calculate monthly income vs expense (for bar chart)
        # Group by month
        monthly_data = defaultdict(lambda: {"income": 0, "expense": 0})
        
        for tx in all_transactions:
            try:
                # Parse date
                tx_date = tx.get("date")
                if isinstance(tx_date, str):
                    # Robust parsing for YYYY-MM-DD
                    tx_date = tx_date.split('T')[0]
                    dt = datetime.strptime(tx_date, "%Y-%m-%d")
                else:
                    dt = tx_date
                
                month_key = dt.strftime("%b %Y")  # e.g., "Jan 2026"
                
                if tx.get("type") == "credit":
                    monthly_data[month_key]["income"] += tx.get("amount", 0)
                else:
                    monthly_data[month_key]["expense"] += tx.get("amount", 0)
            except:
                continue
        
        # Convert to list and sort chronologically
        income_vs_expense = []
        for month, data in monthly_data.items():
             income_vs_expense.append({
                "month": month,
                "income": round(data["income"], 2),
                "expense": round(data["expense"], 2),
                "sort_key": datetime.strptime(month, "%b %Y")  # Temporary for sorting
            })
            
        # Sort by date
        income_vs_expense.sort(key=lambda x: x["sort_key"])
        # Remove sort_key before returning
        for item in income_vs_expense: item.pop("sort_key")
        
        return jsonify({
            "expensesByCategory": expenses_by_category,
            "incomeVsExpense": income_vs_expense
        })

    except Exception as e:
        print(f"ERROR in dashboard_analytics: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ---------------- LIABILITIES (FIX FOR BUG 1) ----------------
@app.route("/api/liabilities/<clerk_user_id>", methods=["GET"])
def get_liabilities(clerk_user_id):
    """Aggregate total liabilities from EMI/Loan/Debt categories"""
    try:
        liability_cats = ["EMI", "Loan", "Debt", "Credit Card", "Liability"]
        
        # 1. Get total liabilities
        pipeline_total = [
            {"$match": {
                "clerk_user_id": clerk_user_id,
                "category": {"$in": liability_cats}
            }},
            {"$group": {
                "_id": None,
                "total": {"$sum": "$amount"}
            }}
        ]
        total_res = list(transactions.aggregate(pipeline_total))
        total = total_res[0]["total"] if total_res else 0.0

        # 2. Get breakdown
        pipeline_breakdown = [
            {"$match": {
                "clerk_user_id": clerk_user_id,
                "category": {"$in": liability_cats}
            }},
            {"$group": {
                "_id": "$category",
                "amount": {"$sum": "$amount"}
            }}
        ]
        breakdown = list(transactions.aggregate(pipeline_breakdown))
        items = [{"category": b["_id"], "amount": b["amount"]} for b in breakdown]

        return jsonify({
            "total": round(total, 2),
            "breakdown": items
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------- INVESTMENT PLAN (REAL DATA) ----------------
@app.route("/api/investments/plan/<clerk_user_id>", methods=["GET"])
def get_investment_plan(clerk_user_id):
    """Generate dynamic investment allocation based on real savings data"""
    try:
        # 1. Get financial totals from transactions
        pipeline = [
            {"$match": {"clerk_user_id": clerk_user_id}},
            {"$group": {
                "_id": "$type",
                "total": {"$sum": "$amount"}
            }}
        ]
        res = list(transactions.aggregate(pipeline))
        income = 0
        expenses = 0
        for r in res:
            if r["_id"] == "credit": income = r["total"]
            elif r["_id"] == "debit": expenses = r["total"]
        
        net_savings = income - expenses
        savings_rate = (net_savings / income * 100) if income > 0 else 0
        
        # 2. Logic to determine profile based on real savings rate
        # Rules: High savings = Aggressive capacity, Low savings = Conservative focus
        if savings_rate > 35:
            risk_profile = "Aggressive"
            health_score = min(7.0 + (savings_rate / 10), 10.0)
            allocation = [
                {"name": "Equity/MF", "value": 60, "color": "#8b5cf6"},
                {"name": "Large Cap", "value": 20, "color": "#4F46E5"},
                {"name": "Debt/FD", "value": 15, "color": "#10B981"},
                {"name": "Cash", "value": 5, "color": "#6b7280"}
            ]
            returns = {"1y": "10-15%", "3y": "14-18%", "5y": "18-24%"}
            metrics = {"volatility": "High", "diversification": "High", "liquidity": "Medium"}
            strategy = f"Strong savings rate of {round(savings_rate)}% detected. You have high risk capacity. We recommend allocating more to high-growth equity instruments for long-term wealth compounding."
        elif savings_rate > 15:
            risk_profile = "Moderate"
            health_score = min(4.0 + (savings_rate / 8), 8.5)
            allocation = [
                {"name": "Equity/MF", "value": 40, "color": "#8b5cf6"},
                {"name": "Debt/Bonds", "value": 40, "color": "#10B981"},
                {"name": "Cash", "value": 15, "color": "#6b7280"},
                {"name": "Gold", "value": 5, "color": "#F59E0B"}
            ]
            returns = {"1y": "6-9%", "3y": "9-12%", "5y": "12-15%"}
            metrics = {"volatility": "Medium", "diversification": "Medium", "liquidity": "High"}
            strategy = "You have a balanced financial profile. A mix of growth (Equity) and stability (Bonds) is recommended to reach your goals while maintaining liquidity."
        else:
            risk_profile = "Conservative"
            health_score = max(1.0, (savings_rate / 5)) if income > 0 else 1.0
            allocation = [
                {"name": "Debt/FD", "value": 60, "color": "#10B981"},
                {"name": "Cash", "value": 30, "color": "#6b7280"},
                {"name": "Equity/MF", "value": 10, "color": "#8b5cf6"}
            ]
            returns = {"1y": "4-6%", "3y": "6-8%", "5y": "8-10%"}
            metrics = {"volatility": "Low", "diversification": "Low", "liquidity": "High"}
            strategy = "Focus on stability. Since your savings rate is currently below 15%, we prioritize capital preservation and building an emergency fund via liquid debt instruments."

        # 3. Handle 0 data case
        if income == 0:
            return jsonify({
                "risk_profile": "Unknown",
                "health_score": 0,
                "allocation": [],
                "projected_returns": {"1y": "0%", "3y": "0%", "5y": "0%"},
                "risk_metrics": {"volatility": "N/A", "diversification": "N/A", "liquidity": "N/A"},
                "strategy_text": "Add your income and expenses to unlock your personalized AI investment strategy."
            })

        return jsonify({
            "risk_profile": risk_profile,
            "health_score": round(health_score, 1),
            "allocation": allocation,
            "projected_returns": returns,
            "risk_metrics": metrics,
            "strategy_text": strategy,
            "net_savings": round(net_savings, 2),
            "savings_rate": round(savings_rate, 1)
        })

    except Exception as e:
        print(f"ERROR in investment_plan: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.before_request
def log_request_info():
    print(f">>> GLOBAL DEBUG: Incoming request: {request.method} {request.path}")


if __name__ == "__main__":
    # Using 0.0.0.0 to ensure it's accessible from all local addresses
    app.run(debug=True, host='0.0.0.0', port=5000)