import os
from dotenv import load_dotenv
from openai import OpenAI
import json
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
prompt_path = os.path.join(script_dir, "prompts", "job_classification_prompt.txt")
CLASSIFICATION_SYSTEM_PROMPT = load_file(prompt_path)


def classify_request(customer_message):
    try:
        response = client.chat.completions.create(
            model="anthropic/claude-haiku-4.5",  # OpenRouter naming
            max_tokens=300,
            temperature=0,
            messages=[
                {"role": "system", "content": CLASSIFICATION_SYSTEM_PROMPT},
                {"role": "user", "content": customer_message}
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"An error occurred: {str(e)}"

def clean_json_response(text):
    text = text.strip()
    if text.startswith("```"):
        # Remove opening fence (```json or ```)
        text = text.split("\n", 1)[1] if "\n" in text else text
        # Remove closing fence
        if text.endswith("```"):
            text = text[:-3]
    return text.strip()

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    prompt_path = os.path.join(script_dir, "test_messages", "test_messages.txt")
    test_messages = [
        line.strip() for line in load_file(prompt_path).splitlines() if line.strip() and not line.strip().startswith("#")
    ]

    """
    for i in range(5):
        print("Customer said:", test_messages[i])
        print("Classification:")
        response = classify_request(test_messages[i])
        clean = clean_json_response(response)
        print(clean)
        print()  # blank line for readability
    """

    for i, msg in enumerate(test_messages, start=1):
        print("Customer said:", msg)
        print("Classification:")
        response = classify_request(msg)
        clean = clean_json_response(response)
        print(clean)
        print()  # blank line for readability

        if i % 7 == 0 and i != len(test_messages):
            print(f"--- Hit {i} requests, pausing 120s to respect rate limit ---")
            time.sleep(120)