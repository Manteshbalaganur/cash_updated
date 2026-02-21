from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

# Connect to MongoDB — SINGLE database for all users
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)

# One unified database
db = client["cashmate"]
transactions = db["transactions"]

print(f'MongoDB connected: {db.name}')
print(f'Transactions collection: {transactions.name}')

# ──────────────────────────────────────────
# Data isolation is done by clerk_user_id field,
# NOT by separate databases.
#
# Every document in 'transactions' has:
#   clerk_user_id: "user_xxx"   ← who owns it
#   date, description, amount, category, type, created_at
#
# Role (normal/super) only controls what the user
# is ALLOWED TO SEE, not where data is stored.
# ──────────────────────────────────────────
