import base64
import binascii

from app.core.llm_client import audio_block, chat, load_prompt


TRANSCRIPTION_SYSTEM_PROMPT = load_prompt("transcription_prompt.txt")

# About a minute of the 16 kHz mono WAV the frontend sends, with headroom. A cap here stops one
# request from posting an arbitrarily large file on to the model.
MAX_AUDIO_BYTES = 4 * 1024 * 1024


def transcribe_audio(audio_base64: str, audio_format: str = "wav") -> str:
    """Transcribe a customer's voice note, in the language they spoke it in.

    Raises ValueError for audio that isn't valid base64 or is too long, and LlmUnavailable when
    the model can't be reached — the router maps those to 400 and 503.
    """
    try:
        audio_bytes = base64.b64decode(audio_base64, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise ValueError("The recording could not be read.") from exc

    if not audio_bytes:
        raise ValueError("The recording is empty.")
    if len(audio_bytes) > MAX_AUDIO_BYTES:
        raise ValueError("The recording is too long. Keep voice notes under a minute.")

    reply = chat(
        TRANSCRIPTION_SYSTEM_PROMPT,
        [{
            "role": "user",
            "content": [
                {"type": "text", "text": "Transcribe this voice note."},
                audio_block(audio_base64, audio_format),
            ],
        }],
        max_tokens=600,
    )

    return reply.strip().strip('"').strip()
