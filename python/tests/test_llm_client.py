import unittest
from types import SimpleNamespace
from unittest.mock import patch

from openai import APIStatusError, AuthenticationError, NotFoundError, RateLimitError

from app.core.llm_client import LlmUnavailable, chat, image_block


def _status_error(cls, message: str, status_code: int):
    """An SDK error without running its constructor, which needs a real HTTP response."""
    exc = cls.__new__(cls)
    Exception.__init__(exc, message)
    exc.status_code = status_code
    exc.response = SimpleNamespace(headers={})
    return exc


def _reply(text):
    return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=text))])


class ChatTests(unittest.TestCase):
    @patch("app.core.llm_client.client.chat.completions.create")
    def test_folds_the_system_prompt_in_as_the_leading_message(self, mock_create):
        mock_create.return_value = _reply("ok")

        result = chat(system="be terse", messages=[{"role": "user", "content": "hi"}])

        self.assertEqual(result, "ok")
        sent = mock_create.call_args.kwargs["messages"]
        # Callers pass `system` separately; this protocol wants it as the first message.
        self.assertEqual(sent[0], {"role": "system", "content": "be terse"})
        self.assertEqual(sent[1]["role"], "user")

    @patch("app.core.llm_client.client.chat.completions.create")
    def test_turns_off_thinking_so_the_budget_reaches_the_answer(self, mock_create):
        mock_create.return_value = _reply("ok")

        chat("s", [{"role": "user", "content": "hi"}])

        # Without this, Gemini 2.5 spends max_tokens reasoning and the JSON comes back
        # truncated or empty. Measured: "Africa" instead of "South Africa" at 400 tokens.
        self.assertEqual(mock_create.call_args.kwargs.get("reasoning_effort"), "none")

    @patch("app.core.llm_client.client.chat.completions.create")
    def test_reports_an_unknown_model_with_the_fix(self, mock_create):
        mock_create.side_effect = _status_error(
            NotFoundError, "Error code: 404 - model not found", 404
        )

        with self.assertRaises(LlmUnavailable) as caught:
            chat("s", [{"role": "user", "content": "hi"}])

        self.assertIn("check_llm.py", str(caught.exception))
        self.assertIn("LLM_MODEL", str(caught.exception))

    @patch("app.core.llm_client.client.chat.completions.create")
    def test_reports_a_bad_key_readably(self, mock_create):
        mock_create.side_effect = _status_error(
            AuthenticationError, "Error code: 401 - invalid key", 401
        )

        with self.assertRaises(LlmUnavailable) as caught:
            chat("s", [{"role": "user", "content": "hi"}])

        self.assertIn("LLM_API_KEY", str(caught.exception))

    @patch("app.core.llm_client.client.chat.completions.create")
    def test_reports_an_exhausted_quota_readably(self, mock_create):
        mock_create.side_effect = _status_error(
            RateLimitError, "Error code: 429 - RESOURCE_EXHAUSTED", 429
        )

        with self.assertRaises(LlmUnavailable) as caught:
            chat("s", [{"role": "user", "content": "hi"}])

        self.assertIn("quota", str(caught.exception))

    @patch("app.core.llm_client.client.chat.completions.create")
    def test_treats_an_empty_reply_as_a_failure(self, mock_create):
        mock_create.return_value = _reply(None)

        with self.assertRaises(LlmUnavailable):
            chat("s", [{"role": "user", "content": "hi"}])

    @patch("app.core.llm_client.client.chat.completions.create")
    def test_wraps_other_status_errors(self, mock_create):
        mock_create.side_effect = _status_error(APIStatusError, "Error code: 500 - boom", 500)

        with self.assertRaises(LlmUnavailable):
            chat("s", [{"role": "user", "content": "hi"}])


class ImageBlockTests(unittest.TestCase):
    def test_passes_the_data_url_through_whole(self):
        block = image_block("data:image/png;base64,AAAA")

        self.assertEqual(
            block, {"type": "image_url", "image_url": {"url": "data:image/png;base64,AAAA"}}
        )


if __name__ == "__main__":
    unittest.main()
