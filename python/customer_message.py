"""CLI test runner for classification. The actual logic now lives in
app/services/classification_service.py so the FastAPI app (app/main.py) and this
script share one implementation — see PROJECT.md §7/§10 for the deploy plan."""
import os
import time

from app.services.classification_service import classify_request  # noqa: F401 (re-exported for callers)


def load_file(file_path):
    with open(file_path, "r") as file:
        return file.read()


if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    prompt_path = os.path.join(script_dir, "test_messages", "test_messages.txt")
    test_messages = [
        line.strip() for line in load_file(prompt_path).splitlines() if line.strip() and not line.strip().startswith("#")
    ]

    for i, msg in enumerate(test_messages, start=1):
        print("Customer said:", msg)
        print("Classification:")
        try:
            print(classify_request(msg))
        except Exception as e:
            print(f"An error occurred: {e}")
        print()  # blank line for readability

        if i % 7 == 0 and i != len(test_messages):
            print(f"--- Hit {i} requests, pausing 120s to respect rate limit ---")
            time.sleep(120)
