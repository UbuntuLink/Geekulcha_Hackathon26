import unittest
from types import SimpleNamespace
from unittest.mock import patch

import anthropic

from app.core.llm_client import LlmUnavailable, chat, image_block


def _status_error(cls, message: str, status_code: int):
    """An SDK error without running its constructor, which needs a real HTTP response."""
    exc = cls.__new__(cls)
    Exception.__init__(exc, message)
    exc.status_code = status_code
    exc.response = SimpleNamespace(headers={})
    return exc


def _reply(text: str):
    return SimpleNamespace(content=[SimpleNamespace(type="text", text=text)])


class ChatTests(unittest.TestCase):
    @patch("app.core.llm_client.client.messages.create")
    def test_sends_the_system_prompt_as_its_own_argument(self, mock_create):
        mock_create.return_value = _reply("ok")

        result = chat(system="be terse", messages=[{"role": "user", "content": "hi"}])

        self.assertEqual(result, "ok")
        kwargs = mock_create.call_args.kwargs
        # Anthropic takes the system prompt top-level; a role:"system" message would be rejected.
        self.assertEqual(kwargs["system"], "be terse")
        self.assertEqual([m["role"] for m in kwargs["messages"]], ["user"])

    @patch("app.core.llm_client.client.messages.create")
    def test_joins_only_the_text_blocks(self, mock_create):
        mock_create.return_value = SimpleNamespace(content=[
            SimpleNamespace(type="thinking", thinking="ignored"),
            SimpleNamespace(type="text", text='{"category":'),
            SimpleNamespace(type="text", text=' "Plumbing"}'),
        ])

        self.assertEqual(chat("s", [{"role": "user", "content": "hi"}]), '{"category": "Plumbing"}')

    @patch("app.core.llm_client.client.messages.create")
    def test_reports_an_exhausted_account_readably(self, mock_create):
        mock_create.side_effect = _status_error(
            anthropic.BadRequestError,
            "Error code: 400 - your credit balance is too low to access the API",
            400,
        )

        with self.assertRaises(LlmUnavailable) as caught:
            chat("s", [{"role": "user", "content": "hi"}])

        self.assertIn("out of credit", str(caught.exception))
        self.assertIn("console.anthropic.com", str(caught.exception))

    @patch("app.core.llm_client.client.messages.create")
    def test_reports_a_bad_key_readably(self, mock_create):
        mock_create.side_effect = _status_error(
            anthropic.AuthenticationError, "Error code: 401 - invalid x-api-key", 401
        )

        with self.assertRaises(LlmUnavailable) as caught:
            chat("s", [{"role": "user", "content": "hi"}])

        self.assertIn("ANTHROPIC_API_KEY", str(caught.exception))


class ImageBlockTests(unittest.TestCase):
    def test_splits_a_browser_data_url(self):
        block = image_block("data:image/png;base64,AAAA")

        self.assertEqual(block["type"], "image")
        self.assertEqual(block["source"]["media_type"], "image/png")
        # The payload must not keep the data-URL header, unlike the OpenAI-shaped API.
        self.assertEqual(block["source"]["data"], "AAAA")

    def test_accepts_bare_base64(self):
        block = image_block("AAAA")

        self.assertEqual(block["source"]["data"], "AAAA")
        self.assertEqual(block["source"]["media_type"], "image/jpeg")

    def test_falls_back_for_a_media_type_anthropic_will_not_take(self):
        block = image_block("data:image/bmp;base64,AAAA")

        self.assertEqual(block["source"]["media_type"], "image/jpeg")


if __name__ == "__main__":
    unittest.main()
