import unittest
from types import SimpleNamespace
from unittest.mock import patch

from openai import APIStatusError

from app.core.llm_client import LlmUnavailable, chat


class _FakeStatusError(APIStatusError):
    """An APIStatusError shaped like the ones OpenRouter returns.

    Built without the real constructor on purpose: that needs an httpx response object, and the
    only things chat() reads are the message, the status code and the Retry-After header.
    """

    def __init__(self, message, status_code, headers=None):
        Exception.__init__(self, message)
        self.status_code = status_code
        self.response = SimpleNamespace(headers=headers or {})


def _status_error(message: str, status_code: int, headers=None):
    return _FakeStatusError(message, status_code, headers)


def _reply(text: str):
    return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=text))])


class ChatTests(unittest.TestCase):
    @patch("app.core.llm_client.client.chat.completions.create")
    def test_shrinks_max_tokens_to_what_the_balance_affords(self, mock_create):
        mock_create.side_effect = [
            _status_error(
                "Error code: 402 - You requested up to 400 tokens, but can only afford 322",
                402,
            ),
            _reply("ok"),
        ]

        self.assertEqual(chat([{"role": "user", "content": "hi"}], max_tokens=400), "ok")
        self.assertEqual(mock_create.call_count, 2)
        self.assertEqual(mock_create.call_args_list[0].kwargs["max_tokens"], 400)
        self.assertEqual(mock_create.call_args_list[1].kwargs["max_tokens"], 322)

    @patch("app.core.llm_client.client.chat.completions.create")
    def test_gives_up_readably_when_the_balance_is_too_small_to_use(self, mock_create):
        mock_create.side_effect = _status_error(
            "Error code: 402 - You requested up to 400 tokens, but can only afford 12", 402
        )

        with self.assertRaises(LlmUnavailable) as caught:
            chat([{"role": "user", "content": "hi"}], max_tokens=400)

        self.assertIn("openrouter.ai/settings/credits", str(caught.exception))
        self.assertEqual(mock_create.call_count, 1)

    @patch("app.core.llm_client.time.sleep")
    @patch("app.core.llm_client.client.chat.completions.create")
    def test_waits_out_an_in_flight_budget_block(self, mock_create, mock_sleep):
        mock_create.side_effect = [
            _status_error(
                "Error code: 402 - This request would exceed your available credits given your "
                "current in-flight requests.",
                402,
                headers={"retry-after": "2"},
            ),
            _reply("ok"),
        ]

        self.assertEqual(chat([{"role": "user", "content": "hi"}]), "ok")
        mock_sleep.assert_called_once_with(2.0)

    @patch("app.core.llm_client.client.chat.completions.create")
    def test_wraps_other_status_errors(self, mock_create):
        mock_create.side_effect = _status_error("Error code: 500 - upstream exploded", 500)

        with self.assertRaises(LlmUnavailable):
            chat([{"role": "user", "content": "hi"}])


if __name__ == "__main__":
    unittest.main()
