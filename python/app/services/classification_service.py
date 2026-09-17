import json
from app.core.llm_client import client, MODEL, load_prompt, clean_json_response

CLASSIFICATION_SYSTEM_PROMPT = load_prompt("job_classification_prompt.txt")


def classify_request(customer_message: str) -> dict:
    """Classify a free-text customer message into a service category. Raises on API/parse failure —
    callers (see app/routers/classification.py) decide how to surface that as an HTTP error."""
    response = client.chat.completions.create(
        model=MODEL,
        max_tokens=300,
        temperature=0,
        messages=[
            {"role": "system", "content": CLASSIFICATION_SYSTEM_PROMPT},
            {"role": "user", "content": customer_message},
        ],
    )
    raw = response.choices[0].message.content
    return json.loads(clean_json_response(raw))
