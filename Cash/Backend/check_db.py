from pymongo import MongoClient
import sys

try:
    client = MongoClient("mongodb://127.0.0.1:27017/", serverSelectionTimeoutMS=2000)
    db = client["cashmate"]
    count = db.transactions.count_documents({})
    print(f"DEBUG: Found {count} documents in cashmate.transactions")
    if count > 0:
        latest = db.transactions.find().sort("created_at", -1).limit(1)[0]
        print(f"DEBUG: Latest transaction: {latest}")
except Exception as e:
    print(f"DEBUG ERROR: {e}")
