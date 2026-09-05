import os
import json
import csv
from dotenv import load_dotenv
from openai import OpenAI  # swap this import if you're using OpenRouter/Groq instead
import time

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPEN_ROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1"      
)


def load_file(file_path):
    with open(file_path, "r") as file:
        return file.read()

# Anchor to this script's own folder, not the terminal's current directory
script_dir = os.path.dirname(os.path.abspath(__file__))
prompt_path = os.path.join(script_dir, "prompts", "pricing_system_prompt.txt")
PRICING_SYSTEM_PROMPT = load_file(prompt_path)

# (category, message) pairs — reused from your already-classified test set
def load_test_cases(file_path):
    test_cases = []
    current_category = None

    for line in load_file(file_path).splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith("#"):
            current_category = stripped.lstrip("#").strip()
        elif current_category is not None:
            test_cases.append((current_category, stripped))

    return test_cases


test_case_path = os.path.join(script_dir, "test_messages", "test_messages.txt")
TEST_CASES = load_test_cases(test_case_path)

MODEL = "anthropic/claude-haiku-4.5"


def estimate_price(category: str, message: str) -> dict:
    user_content = f'Category: {category}\nCustomer message: "{message}"'
    response = client.chat.completions.create(
        model="anthropic/claude-4.5-haiku-20251001",
        max_tokens=300,
        messages=[
            {"role": "system", "content": PRICING_SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
    )
    raw = response.choices[0].message.content
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"category": category, "estimated_min_zar": None,
                "estimated_max_zar": None, "based_on": "PARSE_ERROR",
                "reasoning": raw}


def main():
    for i, (category, message) in enumerate(TEST_CASES, start=1):
        result = estimate_price(category, message)
        print(f"\n[{category}] {message}")
        print(f"  -> R{result.get('estimated_min_zar')}-R{result.get('estimated_max_zar')} "
              f"({result.get('based_on')}) — {result.get('reasoning')}")

        if i % 9 == 0 and i != len(TEST_CASES):
            print("\n--- Hit 9 requests, pausing 60s to respect rate limit ---")
            time.sleep(60)

if __name__ == "__main__":
    main()