import json
from app.core.llm_client import chat, clean_json_response, load_prompt

PRICING_SYSTEM_PROMPT = load_prompt("pricing_system_prompt.txt")


def estimate_price(category: str, message: str) -> dict:
    """Estimate a ZAR price range for a classified job. Only plumbing/electrical are grounded in
    real reference rates today — see PROJECT.md §9f for the other 7 categories."""
    user_content = f'Category: {category}\nCustomer message: "{message}"'
    raw = chat(
        system=PRICING_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
        max_tokens=300,
    )
    try:
        return json.loads(clean_json_response(raw))
    except json.JSONDecodeError:
        return {
            "category": category,
            "estimated_min_zar": None,
            "estimated_max_zar": None,
            "based_on": "PARSE_ERROR",
            "reasoning": raw,
        }
