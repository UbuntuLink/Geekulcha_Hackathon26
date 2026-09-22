import json

from app.core.llm_client import client, MODEL, load_prompt, clean_json_response


CLASSIFICATION_SYSTEM_PROMPT = load_prompt(
    "job_classification_prompt.txt"
)

REFINE_DESCRIPTION_SYSTEM_PROMPT = load_prompt(
    "refine_job_description_prompt.txt"
)


def classify_request(customer_message: str) -> dict:

    """Classify a free-text customer message into a service category."""

    response = client.chat.completions.create(
        model=MODEL,
        max_tokens=300,
        temperature=0,
        messages=[
            {
                "role": "system",
                "content": CLASSIFICATION_SYSTEM_PROMPT
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