import json
from app.core.llm_client import client, MODEL, load_prompt, clean_json_response

PRICING_SYSTEM_PROMPT = load_prompt("pricing_system_prompt.txt")


def estimate_price(category: str, message: str) -> dict:
    """Estimate a ZAR price range for a classified job. Only plumbing/electrical are grounded in
    real reference rates today — see PROJECT.md §9f for the other 7 categories."""
    user_content = f'Category: {category}\nCustomer message: "{message}"'
    response = client.chat.completions.create(
        model=MODEL,
        max_tokens=300,
        messages=[
            {"role": "system", "content": PRICING_SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
    )
    raw = response.choices[0].message.content
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
