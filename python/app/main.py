from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import FRONTEND_URL
from app.routers import classification, pricing, quantum, transcription

app = FastAPI(title="UbuntuLink ML Service")

# FRONTEND_URL comes from Render's dashboard and may be empty or a comma-separated list. Blank
# entries are dropped: an empty string here matches no origin, so every browser request would be
# rejected at preflight while curl kept working — see SecurityConfig.java for the same guard.
_allowed_origins = [
    origin.strip()
    for origin in [*FRONTEND_URL.split(","), "http://localhost:5173", "http://localhost:8080"]
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    # Vercel mints a new hostname for every deploy, branch and preview build; without this only
    # whichever single URL is in FRONTEND_URL would work.
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(classification.router)
app.include_router(pricing.router)
app.include_router(quantum.router)
app.include_router(transcription.router)


@app.get("/health")
def health():
    return {"status": "ok"}