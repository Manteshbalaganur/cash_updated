from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")

# 1. Normal User Database
normal_db = client["cashmate_normal"]
normal_transactions = normal_db["transactions"]
print('Normal DB connected:', normal_db.name)

# 2. Super User Database
super_db = client["cashmate_super"]
super_transactions = super_db["transactions"]
print('Super DB connected:', super_db.name)

# Maintain backward compatibility for existing routes (pointing to normal DB by default)
db = normal_db
transactions = normal_transactions
print("Default 'transactions' collection mapped to 'cashmate_normal'")
