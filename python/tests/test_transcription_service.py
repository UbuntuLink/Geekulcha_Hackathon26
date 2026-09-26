import base64
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app
from app.services.transcription_service import MAX_AUDIO_BYTES, transcribe_audio


def _reply(text: str):
    return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=text))])


AUDIO = base64.b64encode(b"RIFF fake wav bytes").decode()


class TranscriptionServiceTests(unittest.TestCase):
    @patch("app.core.llm_client.client.chat.completions.create")
    def test_sends_audio_as_input_audio_part(self, mock_create):
        mock_create.return_value = _reply('  "Ipayipi le kitchen liyavuza."  ')

        text = transcribe_audio(AUDIO)

        # Surrounding whitespace and quotes are dropped; the language is left as spoken.
        self.assertEqual(text, "Ipayipi le kitchen liyavuza.")
        user_content = mock_create.call_args.kwargs["messages"][1]["content"]
        audio = [p for p in user_content if p.get("type") == "input_audio"]
        self.assertEqual(audio, [{"type": "input_audio", "input_audio": {"data": AUDIO, "format": "wav"}}])

    @patch("app.core.llm_client.client.chat.completions.create")
    def test_rejects_bad_or_oversized_audio_without_calling_the_model(self, mock_create):
        with self.assertRaises(ValueError):
            transcribe_audio("not base64!!")
        with self.assertRaises(ValueError):
            transcribe_audio(base64.b64encode(b"x" * (MAX_AUDIO_BYTES + 1)).decode())
        mock_create.assert_not_called()

    @patch("app.core.llm_client.client.chat.completions.create")
    def test_endpoint(self, mock_create):
        mock_create.return_value = _reply("My geyser is leaking.")
        client = TestClient(app)

        ok = client.post("/transcribe", json={"audioBase64": AUDIO})
        self.assertEqual(ok.status_code, 200)
        self.assertEqual(ok.json(), {"text": "My geyser is leaking."})

        self.assertEqual(client.post("/transcribe", json={"audioBase64": "@@@"}).status_code, 400)
        self.assertEqual(
            client.post("/transcribe", json={"audioBase64": AUDIO, "audioFormat": "webm"}).status_code,
            422,
        )


if __name__ == "__main__":
    unittest.main()
