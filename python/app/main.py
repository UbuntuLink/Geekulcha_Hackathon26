from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import FRONTEND_URL
from app.routers import classification, pricing

app = FastAPI(title="UbuntuLink ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173", "http://localhost:8080"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(classification.router)
app.include_router(pricing.router)


@app.get("/health")
def health():
    return {"status": "ok"}
