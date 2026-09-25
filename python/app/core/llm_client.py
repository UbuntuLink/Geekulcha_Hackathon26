"""The one place that knows which model provider we talk to.

Deliberately provider-agnostic: it speaks the OpenAI chat-completions protocol, which Google
(Gemini), OpenRouter, Groq, Together and others all serve. Switching provider is an edit to
python/.env, not to this file — this project has already changed provider twice, and the
services above should not have to care.

    provider     LLM_BASE_URL                                                  LLM_MODEL
    ---------    ----------------------------------------------------------    ------------------
    Gemini       https://generativelanguage.googleapis.com/v1beta/openai/       gemini-2.5-flash
    OpenRouter   https://openrouter.ai/api/v1                                   anthropic/claude-haiku-4.5
    Groq         https://api.groq.com/openai/v1                                 llama-3.3-70b-versatile

Run `python check_llm.py` after changing any of it — it lists the models your key can actually
see and makes one test call.
"""

import os

from openai import (
    APIConnectionError,
    APIStatusError,
    AuthenticationError,
    NotFoundError,
    OpenAI,
    RateLimitError,
)

import app.core.config  # noqa: F401  — imported for its load_dotenv() side effect

BASE_URL = os.getenv("LLM_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai/")
MODEL = os.getenv("LLM_MODEL", "gemini-2.5-flash")


# Accepted names per provider. Matching ignores case and underscores, because these get typed
# by hand into .env files — "Gemini_key" should work as well as "GEMINI_API_KEY".
_KEY_NAMES = {
    "googleapis": ("GEMINI_API_KEY", "GEMINI_KEY", "GOOGLE_API_KEY"),
    "openrouter": ("OPEN_ROUTER_API_KEY", "OPENROUTER_API_KEY"),
    "groq": ("GROQ_API_KEY",),
}


def _normalise(name: str) -> str:
    return name.replace("_", "").upper()


def resolve_api_key() -> tuple[str | None, str | None]:
    """The key for the provider in use, and the variable it came from.

    Provider-aware on purpose: a leftover OPEN_ROUTER_API_KEY in someone's .env must not be
    posted to Google, which rejects it with a confusing "invalid argument" from the wrong vendor.
    """
    explicit = os.getenv("LLM_API_KEY")
    if explicit:
        return explicit, "LLM_API_KEY"

    host = BASE_URL.split("//")[-1].split("/")[0]
    accepted = next((names for marker, names in _KEY_NAMES.items() if marker in host), ())
    wanted = {_normalise(name) for name in accepted}

    for actual_name, value in os.environ.items():
        if _normalise(actual_name) in wanted and value.strip():
            return value.strip(), actual_name

    return None, None


LLM_API_KEY, LLM_API_KEY_SOURCE = resolve_api_key()

# A whole-run ceiling, for keeping a demo inside a known budget without editing code.
_MAX_TOKENS_OVERRIDE = os.getenv("LLM_MAX_TOKENS")

# Gemini 2.5 models think before answering, and the thinking counts against max_tokens. Left on,
# a 400-token budget is spent reasoning and the JSON comes back truncated or empty — measured:
# "Which country is Johannesburg in?" answered "Africa" at 400 tokens, and nothing at all at 20.
# These are classification and pricing calls, so there is nothing to reason about; "none" gives
# the whole budget to the answer. Set LLM_REASONING_EFFORT to low/medium/high to turn it back on,
# or to "off" for a provider that rejects the parameter.
_REASONING_EFFORT = os.getenv(
    "LLM_REASONING_EFFORT",
    "none" if "googleapis" in BASE_URL else "off",
)

# The SDK retries 429s, 5xx and connection errors with backoff, so there is no retry loop here.
# The placeholder keeps a missing key from raising at import time, which would take the whole
# FastAPI app down on startup; chat() reports it as LlmUnavailable on the first call instead.
client = OpenAI(api_key=LLM_API_KEY or "missing-api-key", base_url=BASE_URL, max_retries=3)


class LlmUnavailable(RuntimeError):
    """The model could not be reached, paid for, or found.

    Raised instead of letting a raw SDK error escape, so callers can print one readable line
    rather than a screenful of nested JSON, and can tell "fix your key or quota" apart from
    "something in the request was wrong".
    """


def chat(system: str, messages: list, max_tokens: int = 350, temperature: float = 0) -> str:
    """One call to the model, returning the reply text.

    `system` is passed separately by callers and folded in here as the leading system message,
    so a provider that wants it elsewhere only changes this function.
    """
    tokens = int(_MAX_TOKENS_OVERRIDE) if _MAX_TOKENS_OVERRIDE else max_tokens
    extra = {} if _REASONING_EFFORT == "off" else {"reasoning_effort": _REASONING_EFFORT}

    try:
        response = client.chat.completions.create(
            model=MODEL,
            max_tokens=tokens,
            temperature=temperature,
            messages=[{"role": "system", "content": system}, *messages],
            **extra,
        )

    except AuthenticationError as exc:
        raise LlmUnavailable(
            f"{_provider()} rejected the API key. Check LLM_API_KEY in python/.env."
        ) from exc

    except NotFoundError as exc:
        raise LlmUnavailable(
            f"{_provider()} has no model called '{MODEL}'. Run `python check_llm.py` to list "
            "the models your key can use, then set LLM_MODEL in python/.env."
        ) from exc

    except RateLimitError as exc:
        raise LlmUnavailable(
            f"{_provider()} rate limit or free-tier quota reached, and the retries did not clear "
            "it. Wait a minute, or switch LLM_BASE_URL/LLM_MODEL to another provider."
        ) from exc

    except APIConnectionError as exc:
        raise LlmUnavailable(f"Could not reach {_provider()} — check your connection.") from exc

    except APIStatusError as exc:
        body = str(exc).lower()
        # Gemini reports a bad key as 400 INVALID_ARGUMENT rather than 401, so the status code
        # alone is not enough to tell "wrong key" from "malformed request".
        if "api key" in body or "api_key" in body:
            raise LlmUnavailable(
                f"{_provider()} rejected the API key. Check the key in python/.env — is it one "
                f"{_provider()} issued, rather than another provider's?"
            ) from exc
        if exc.status_code == 402 or "credit" in body or "quota" in body:
            raise LlmUnavailable(
                f"{_provider()} refused the request for lack of credit or quota."
            ) from exc
        raise LlmUnavailable(f"{_provider()} returned HTTP {exc.status_code}.") from exc

    choice = response.choices[0].message.content
    if not choice:
        raise LlmUnavailable(f"{_provider()} returned an empty reply.")
    return choice


def image_block(photo_data_url: str) -> dict:
    """An uploaded photo as an OpenAI-protocol image part.

    The browser's "data:image/jpeg;base64,..." string is passed through whole — this protocol
    accepts a data URL directly, unlike the Anthropic API which wants the media type split out.
    """
    return {"type": "image_url", "image_url": {"url": photo_data_url}}


def _provider() -> str:
    """A readable provider name for error messages, taken from the base URL's host."""
    host = BASE_URL.split("//")[-1].split("/")[0]
    if "googleapis" in host:
        return "Gemini"
    if "openrouter" in host:
        return "OpenRouter"
    if "groq" in host:
        return "Groq"
    return host


def load_prompt(filename: str) -> str:
    script_dir = os.path.dirname(os.path.abspath(__file__))
    prompt_path = os.path.join(script_dir, "..", "..", "prompts", filename)
    with open(prompt_path, "r", encoding="utf-8") as file:
        return file.read()


def clean_json_response(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text
        if text.endswith("```"):
            text = text[:-3]
    return text.strip()
