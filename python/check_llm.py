"""Check that the model provider in python/.env is configured, and say what is wrong if not.

    python check_llm.py            # config + the models your key can see. No generation.
    python check_llm.py --call     # also send one short test prompt.

The app is the only thing that should be generating text against the provider, so the test call
is opt-in. Everything the default run does is free: reading .env and listing models.
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


def main(argv: list[str]) -> int:
    make_call = "--call" in argv

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
    model_found = False
    try:
        names = sorted(model.id for model in client.models.list())
        for name in names:
            is_current = name == MODEL or name.endswith(f"/{MODEL}")
            model_found = model_found or is_current
            print(f"  {name}{'  <- LLM_MODEL' if is_current else ''}")
        if not model_found:
            print(f"\n  '{MODEL}' is NOT in that list — set LLM_MODEL in python/.env to one of them.")
            return 1
    except Exception as exc:  # listing is a convenience; a provider may not support it
        print(f"  (could not list models: {exc})")

    if not make_call:
        print("\nConfiguration looks right. Re-run with --call to send one test prompt.")
        return 0

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
    sys.exit(main(sys.argv[1:]))
