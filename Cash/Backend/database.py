from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

client = MongoClient("mongodb://127.0.0.1:27017/")
db = client["cashmate"]
transactions = db["transactions"]

print("Connected to local MongoDB - cashmate database")
