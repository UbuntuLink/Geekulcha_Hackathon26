import json
from typing import List, Optional

from app.core.llm_client import client, MODEL, load_prompt, clean_json_response


CLASSIFICATION_SYSTEM_PROMPT = load_prompt(
    "job_classification_prompt.txt"
)

REFINE_DESCRIPTION_SYSTEM_PROMPT = load_prompt(
    "refine_job_description_prompt.txt"
)


def _system_prompt(categories: Optional[List[str]]) -> str:
    """Append the caller's live catalog to the base prompt, if it sent one.

    The prompt file carries a default list, but the database is the real authority on what
    categories exist. When the frontend passes the catalog it just loaded, the model can only
    answer in names that actually exist as rows — which is what stops the classic failure where
    the model says "mechanic" and the catalog says "Automotive Repair", leaving the customer
    with no providers at all.
    """
    clean = [str(c).strip() for c in (categories or []) if str(c).strip()]
    if not clean:
        return CLASSIFICATION_SYSTEM_PROMPT

    listed = "\n".join(f"- {name}" for name in clean)
    return (
        f"{CLASSIFICATION_SYSTEM_PROMPT}\n\n"
        "Available categories (this list replaces the one above — answer with exactly one of "
        "these names, spelled exactly as written, or \"other\" if nothing here fits):\n"
        f"{listed}\n- other\n"
    )


def classify_request(customer_message: str, categories: Optional[List[str]] = None) -> dict:
    """Classify a free-text customer message into a service category. Raises on API/parse failure —
    callers (see app/routers/classification.py) decide how to surface that as an HTTP error."""

    response = client.chat.completions.create(
        model=MODEL,
        max_tokens=400,
        temperature=0,
        messages=[
            {
                "role": "system",
                "content": _system_prompt(categories)
            },
            {
                "role": "user",
                "content": customer_message
            },
        ],
    )

    raw = response.choices[0].message.content

    return json.loads(clean_json_response(raw))


def refine_description(
    job_description: str,
    additional_details: str
) -> dict:

    """Refine an existing job description using additional customer details."""

    customer_message = f"""
Existing job description:
{job_description}

Additional details:
{additional_details}
"""

    response = client.chat.completions.create(
        model=MODEL,
        max_tokens=200,
        temperature=0,
        messages=[
            {
                "role": "system",
                "content": REFINE_DESCRIPTION_SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": customer_message
            },
        ],
    )

    raw = response.choices[0].message.content

    return json.loads(clean_json_response(raw))