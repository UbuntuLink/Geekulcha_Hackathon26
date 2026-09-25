import unittest
from types import SimpleNamespace
from unittest.mock import patch

from app.services.classification_service import classify_request


class ClassificationServiceTests(unittest.TestCase):
    @patch("app.services.classification_service.client.chat.completions.create")
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

        result = classify_request("There is water leaking from the wall.", "data:image/jpeg;base64,abc123")

        self.assertEqual(result["category"], "plumbing")
        payload = mock_create.call_args.kwargs
        user_content = payload["messages"][1]["content"]
        self.assertTrue(any(part.get("type") == "image_url" for part in user_content if isinstance(part, dict)))


if __name__ == "__main__":
    unittest.main()
