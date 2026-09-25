import os
import re
import time

from openai import APIConnectionError, APIStatusError, OpenAI

from app.core.config import OPEN_ROUTER_API_KEY

MODEL = "anthropic/claude-haiku-4.5"  # OpenRouter naming

client = OpenAI(
    api_key=OPEN_ROUTER_API_KEY,
    base_url="https://openrouter.ai/api/v1",
)

# A whole-run ceiling, for squeezing work out of a nearly empty account without editing code.
_MAX_TOKENS_OVERRIDE = os.getenv("LLM_MAX_TOKENS")

_MAX_ATTEMPTS = 3
_MAX_SLEEP_SECONDS = 120

# OpenRouter says "You requested up to 400 tokens, but can only afford 322" when the balance is
# nearly gone. That number is the largest request the remaining credit will pay for.
_AFFORDABLE = re.compile(r"can only afford (\d+)")


class LlmUnavailable(RuntimeError):
    """The model could not be reached or paid for.

    Raised instead of letting a raw openai error escape, so callers can print one readable line
    rather than a screenful of nested JSON, and can tell "top up your account" apart from
    "something in the request was wrong".
    """


def _retry_after_seconds(exc: APIStatusError) -> float | None:
    header = None
    response = getattr(exc, "response", None)
    if response is not None:
        header = response.headers.get("retry-after")
    if header is None:
        return None
    try:
        return min(float(header), _MAX_SLEEP_SECONDS)
    except (TypeError, ValueError):
        return None


def chat(messages, max_tokens: int = 350, temperature: float = 0) -> str:
    """One call to the model, returning the raw text.

    Retries the two failures that are worth retrying — a rate limit, and a request that is only
    slightly too large for the remaining credit — and turns everything else into LlmUnavailable.
    """
    tokens = int(_MAX_TOKENS_OVERRIDE) if _MAX_TOKENS_OVERRIDE else max_tokens

    for attempt in range(_MAX_ATTEMPTS):
        last_attempt = attempt == _MAX_ATTEMPTS - 1

        try:
            response = client.chat.completions.create(
                model=MODEL,
                max_tokens=tokens,
                temperature=temperature,
                messages=messages,
            )
            return response.choices[0].message.content

        except APIStatusError as exc:
            body = str(exc)

            if exc.status_code == 402:
                # Shrink to what the balance actually covers and try once more, rather than
                # failing a request the account could still pay for.
                affordable = _AFFORDABLE.search(body)
                if affordable:
                    budget = int(affordable.group(1))
                    if 120 <= budget < tokens:
                        tokens = budget
                        continue
                    raise LlmUnavailable(
                        f"OpenRouter credit is down to roughly {budget} tokens — too little for a "
                        "useful answer. Top up at https://openrouter.ai/settings/credits."
                    ) from exc

                wait = _retry_after_seconds(exc)
                if wait and not last_attempt:
                    # in_flight_budget_exhausted: earlier requests are still settling.
                    time.sleep(wait)
                    continue

                raise LlmUnavailable(
                    "OpenRouter refused the request for lack of credit. Top up at "
                    "https://openrouter.ai/settings/credits."
                ) from exc

            if exc.status_code == 429 and not last_attempt:
                time.sleep(_retry_after_seconds(exc) or 20)
                continue

            raise LlmUnavailable(f"OpenRouter returned HTTP {exc.status_code}.") from exc

        except APIConnectionError as exc:
            if last_attempt:
                raise LlmUnavailable("Could not reach OpenRouter — check your connection.") from exc
            time.sleep(5)

    raise LlmUnavailable("OpenRouter did not answer after several attempts.")


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
