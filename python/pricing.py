"""CLI test runner for pricing. The actual logic now lives in
app/services/pricing_service.py so the FastAPI app (app/main.py) and this
script share one implementation — see PROJECT.md §7/§10 for the deploy plan."""
import os
import time

from app.services.pricing_service import estimate_price  # noqa: F401 (re-exported for callers)


def load_file(file_path):
    with open(file_path, "r") as file:
        return file.read()


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


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    test_case_path = os.path.join(script_dir, "test_messages", "test_messages.txt")
    test_cases = load_test_cases(test_case_path)

    for i, (category, message) in enumerate(test_cases, start=1):
        result = estimate_price(category, message)
        print(f"\n[{category}] {message}")
        print(f"  -> R{result.get('estimated_min_zar')}-R{result.get('estimated_max_zar')} "
              f"({result.get('based_on')}) — {result.get('reasoning')}")

        if i % 9 == 0 and i != len(test_cases):
            print("\n--- Hit 9 requests, pausing 60s to respect rate limit ---")
            time.sleep(60)


if __name__ == "__main__":
    main()
