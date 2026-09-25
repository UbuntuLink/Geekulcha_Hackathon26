"""Check that the model provider in python/.env is reachable, and say what is wrong if not.

    python check_llm.py

Prints the provider, the key status, the models the key can actually see, and the result of one
cheap test call. Run it after changing LLM_BASE_URL, LLM_MODEL or the key — model names differ
per provider and go out of date, so listing them beats guessing.
"""

import sys

from app.core.llm_client import (
    BASE_URL,
    LLM_API_KEY,
    LLM_API_KEY_SOURCE,
    MODEL,
    LlmUnavailable,
    chat,
    client,
)


def main() -> int:
    print(f"base URL : {BASE_URL}")
    print(f"model    : {MODEL}")

    if not LLM_API_KEY:
        print("key      : MISSING")
        print(
            "\nNo API key found for this provider. Add one to python/.env:\n"
            "    LLM_API_KEY=your-key-here\n"
            "Provider-specific names work too (GEMINI_API_KEY, OPEN_ROUTER_API_KEY, "
            "GROQ_API_KEY), matched ignoring case and underscores."
        )
        return 1

    print(f"key      : {len(LLM_API_KEY)} characters, from {LLM_API_KEY_SOURCE}")

    print("\nModels this key can see:")
    try:
        names = sorted(model.id for model in client.models.list())
        for name in names:
            marker = "  <- LLM_MODEL" if name.endswith(MODEL) or name == MODEL else ""
            print(f"  {name}{marker}")
        if not any(name == MODEL or name.endswith(MODEL) for name in names):
            print(f"\n  '{MODEL}' is NOT in that list — set LLM_MODEL in python/.env to one of them.")
    except Exception as exc:  # listing is a convenience; a provider may not support it
        print(f"  (could not list models: {exc})")

    print("\nTest call...")
    try:
        reply = chat(
            system="Answer with exactly one word.",
            messages=[{"role": "user", "content": "Which country is Johannesburg in?"}],
            max_tokens=20,
        )
    except LlmUnavailable as exc:
        print(f"  FAILED: {exc}")
        return 1

    print(f"  OK: {reply.strip()!r}")
    print("\nProvider is working.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
