from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from conversational_model.chat_controller import cnv_router

def create_app() -> FastAPI:
    app = FastAPI(
        title="Vault Finance Bot API",
        description="Finance AI Assistant - SAP Marathon project",
        version="1.0.0",
    )

    # Allow frontend to connect (especially useful during dev)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include our router
    app.include_router(cnv_router)

    @app.get("/")
    def root():
        return {"message": "Vault Finance Bot API is running → go to /chat"}

    return app



app = create_app()
