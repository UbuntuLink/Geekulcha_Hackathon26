import os

import anthropic

from app.core.config import ANTHROPIC_API_KEY

# The Anthropic API names models without a vendor prefix (OpenRouter called this
# "anthropic/claude-haiku-4.5"). Override with CLAUDE_MODEL to try a bigger model —
# "claude-sonnet-5" or "claude-opus-5" — without touching code.
MODEL = os.getenv("CLAUDE_MODEL", "claude-haiku-4-5")

# A whole-run ceiling, for keeping a demo inside a known budget without editing code.
_MAX_TOKENS_OVERRIDE = os.getenv("LLM_MAX_TOKENS")

# The SDK already retries 429s, 5xx and connection errors with backoff, so there is no retry
# loop here — max_retries is the only knob.
client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY, max_retries=3)


class LlmUnavailable(RuntimeError):
    """The model could not be reached or paid for.

    Raised instead of letting a raw SDK error escape, so callers can print one readable line
    rather than a screenful of nested JSON, and can tell "top up the account" apart from
    "something in the request was wrong".
    """


def chat(system: str, messages: list, max_tokens: int = 350, temperature: float = 0) -> str:
    """One call to Claude, returning the concatenated text of the reply.

    Note the shape difference from the OpenAI-style API this replaced: Anthropic takes the
    system prompt as its own top-level argument rather than a first message with role "system".
    """
    tokens = int(_MAX_TOKENS_OVERRIDE) if _MAX_TOKENS_OVERRIDE else max_tokens

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=tokens,
            temperature=temperature,
            system=system,
            messages=messages,
        )

    except anthropic.AuthenticationError as exc:
        raise LlmUnavailable(
            "Anthropic rejected the API key. Check ANTHROPIC_API_KEY in python/.env."
        ) from exc

    except anthropic.PermissionDeniedError as exc:
        raise LlmUnavailable("This Anthropic key is not allowed to use that model.") from exc

    except anthropic.NotFoundError as exc:
        raise LlmUnavailable(f"Anthropic does not know the model '{MODEL}'.") from exc

    except anthropic.RateLimitError as exc:
        raise LlmUnavailable(
            "Anthropic rate limit reached, and the retries did not clear it. Wait a minute."
        ) from exc

    except anthropic.BadRequestError as exc:
        # An exhausted account arrives as a 400 rather than a dedicated billing error.
        if "credit balance" in str(exc).lower():
            raise LlmUnavailable(
                "The Anthropic account is out of credit. Top up at "
                "https://console.anthropic.com/settings/billing."
            ) from exc
        raise LlmUnavailable(f"Anthropic rejected the request: {exc}") from exc

    except anthropic.APIConnectionError as exc:
        raise LlmUnavailable("Could not reach Anthropic — check your connection.") from exc

    except anthropic.APIStatusError as exc:
        raise LlmUnavailable(f"Anthropic returned HTTP {exc.status_code}.") from exc

    # content is a list of blocks; only the text ones carry the answer.
    return "".join(block.text for block in response.content if block.type == "text")


def image_block(photo_data_url: str) -> dict:
    """Turn a browser data URL into an Anthropic image block.

    The frontend sends "data:image/jpeg;base64,AAAA...". The OpenAI-shaped API took that whole
    string; Anthropic wants the media type and the payload as separate fields.
    """
    header, _, payload = photo_data_url.partition(",")

    if not payload:  # bare base64, no data-URL wrapper
        payload, media_type = photo_data_url, "image/jpeg"
    else:
        media_type = header.removeprefix("data:").split(";")[0].strip() or "image/jpeg"

    if media_type not in {"image/jpeg", "image/png", "image/gif", "image/webp"}:
        media_type = "image/jpeg"

    return {
        "type": "image",
        "source": {"type": "base64", "media_type": media_type, "data": payload},
    }


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
