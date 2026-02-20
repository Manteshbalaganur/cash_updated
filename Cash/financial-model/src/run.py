import uvicorn 
from main import app 
 
if __name__ == "__main__": 
    print("Starting Vault Finance Bot...") 
    print("Open: http://localhost:8000/chat") 
    uvicorn.run(app, host="0.0.0.0", port=8000) 
