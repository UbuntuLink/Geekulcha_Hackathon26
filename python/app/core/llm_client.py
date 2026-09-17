import os
from openai import OpenAI
from app.core.config import OPEN_ROUTER_API_KEY

MODEL = "anthropic/claude-haiku-4.5"  # OpenRouter naming

client = OpenAI(
    api_key=OPEN_ROUTER_API_KEY,
    base_url="https://openrouter.ai/api/v1",
)


def load_prompt(filename: str) -> str:
    script_dir = os.path.dirname(os.path.abspath(__file__))
    prompt_path = os.path.join(script_dir, "..", "..", "prompts", filename)
    with open(prompt_path, "r") as file:
        return file.read()


def clean_json_response(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text
        if text.endswith("```"):
            text = text[:-3]
    return text.strip()
