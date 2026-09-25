import unittest
from types import SimpleNamespace
from unittest.mock import patch

from app.services.classification_service import classify_request


class ClassificationServiceTests(unittest.TestCase):
    @patch("app.core.llm_client.client.chat.completions.create")
    def test_classify_request_includes_photo_in_multimodal_request(self, mock_create):
        mock_create.return_value.choices = [
            SimpleNamespace(
                message=SimpleNamespace(
                    content=(
                        '{'
                        '"category": "plumbing", '
                        '"confidence": "high", '
                        '"reasoning": "Water damage is visible in the image and the customer reports a leak.", '
                        '"clarifying_question": null, '
                        '"advice": null, '
                        '"urgency": "high", '
                        '"job_description": "Repair a leaking pipe causing visible water damage."'
                        '}'
                    )
                )
            )
        ]

        # photo_data_url is keyword-only in practice: the second positional argument is the
        # service catalog (see classify_request).
        result = classify_request(
            "There is water leaking from the wall.",
            photo_data_url="data:image/jpeg;base64,abc123",
        )

        self.assertEqual(result["category"], "plumbing")
        payload = mock_create.call_args.kwargs
        user_content = payload["messages"][1]["content"]
        self.assertTrue(any(part.get("type") == "image_url" for part in user_content if isinstance(part, dict)))

    @patch("app.core.llm_client.client.chat.completions.create")
    def test_classify_request_uses_the_callers_catalog(self, mock_create):
        mock_create.return_value.choices = [
            SimpleNamespace(
                message=SimpleNamespace(
                    content='{"category": "Automotive Repair", "confidence": "high", '
                            '"reasoning": "The customer describes a vehicle that will not start.", '
                            '"clarifying_question": null, "advice": null, "urgency": "medium", '
                            '"sort_preference": "none", '
                            '"job_description": "Diagnose a vehicle that will not start."}'
                )
            )
        ]

        result = classify_request("my bakkie wont start", ["Plumbing", "Automotive Repair"])

        self.assertEqual(result["category"], "Automotive Repair")
        system_prompt = mock_create.call_args.kwargs["messages"][0]["content"]
        # The live catalog has to reach the model, or it answers in its own vocabulary and the
        # frontend finds no matching service row.
        self.assertIn("Automotive Repair", system_prompt)
        self.assertIn("Plumbing", system_prompt)

    @patch("app.core.llm_client.client.chat.completions.create")
    def test_classify_request_without_a_catalog_uses_the_prompt_file(self, mock_create):
        mock_create.return_value.choices = [
            SimpleNamespace(
                message=SimpleNamespace(
                    content='{"category": "other", "confidence": "high", "reasoning": "Out of scope.", '
                            '"clarifying_question": null, "advice": "Try a computer shop.", '
                            '"urgency": "low", "sort_preference": "none", '
                            '"job_description": "Customer wants to buy a laptop."}'
                )
            )
        ]

        classify_request("i want to buy a laptop")

        system_prompt = mock_create.call_args.kwargs["messages"][0]["content"]
        self.assertNotIn("this list replaces the one above", system_prompt)


if __name__ == "__main__":
    unittest.main()
