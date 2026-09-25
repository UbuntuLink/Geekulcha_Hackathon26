import os
from dotenv import load_dotenv

load_dotenv()

# The key lives in app/core/llm_client.py, which resolves it against the provider in use —
# a key belonging to one provider must never be sent to another.
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

PROMPTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "prompts")
