from pymongo import MongoClient
from datetime import datetime

try:
    client = MongoClient("mongodb://127.0.0.1:27017/")
    db = client["cashmate"]
    record = {
        "clerk_user_id": "test_agent_user",
        "date": datetime.utcnow().isoformat(),
        "description": "Agent Test Transaction",
        "amount": 99.99,
        "category": "Others",
        "type": "debit",
        "created_at": datetime.utcnow()
    }
    res = db.transactions.insert_one(record)
    print(f"DEBUG SUCCESS: Inserted test document with ID: {res.inserted_id}")
except Exception as e:
    print(f"DEBUG ERROR: {e}")
