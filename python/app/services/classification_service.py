import json
from typing import Optional

from app.core.llm_client import client, MODEL, load_prompt, clean_json_response

CLASSIFICATION_SYSTEM_PROMPT = load_prompt("job_classification_prompt.txt")


def classify_request(customer_message: str, photo_data_url: Optional[str] = None) -> dict:
    """Classify a customer message and optional photo into a service category.

    If a data URL image is provided, it is sent as a multimodal OpenRouter input so the model can
    diagnose the issue from the picture and generate a professional job description.
    """
    text_prompt = customer_message.strip() if customer_message and customer_message.strip() else "Analyze the uploaded image and identify the likely service issue."

    user_content = [{"type": "text", "text": text_prompt}]
    if photo_data_url:
        user_content.append({
            "type": "image_url",
            "image_url": {"url": photo_data_url},
        })

    response = client.chat.completions.create(
        model=MODEL,
        max_tokens=300,
        temperature=0,
        messages=[
            {"role": "system", "content": CLASSIFICATION_SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
    )
    raw = response.choices[0].message.content
    return json.loads(clean_json_response(raw))
