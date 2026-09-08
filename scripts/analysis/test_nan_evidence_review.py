"""Offline regression checks: invalid worker output must never count as reviewed."""
import json
import unittest

from runNanEvidenceReview import input_is_complete, parse_result, validate_reviews
from buildNanMappingPackets import cno_sections


class EvidenceReviewTests(unittest.TestCase):
    def setUp(self):
        self.packet = {"cases": [{"id": "a"}, {"id": "b"}]}
        self.result = {"reviews": [{"id": key, "verdict": "uncertain", "reason": "Falta evidencia."} for key in ["a", "b"]]}

    def test_provider_error_overrides_apparent_success(self):
        events = [{"type": "text", "part": {"text": json.dumps(self.result)}}, {"type": "error"}]
        with self.assertRaises(ValueError):
            parse_result("\n".join(map(json.dumps, events)))

    def test_empty_completion_is_not_a_review(self):
        with self.assertRaises(ValueError):
            parse_result(json.dumps({"type": "step_finish", "part": {"tokens": {"output": 0}}}))

    def test_fenced_json_is_read_without_executing_it(self):
        result, _ = parse_result(json.dumps({"type": "text", "part": {"text": "```json\n" + json.dumps(self.result) + "\n```"}}))
        validate_reviews(result, self.packet)
        self.assertEqual(result, self.result)

    def test_duplicate_review_does_not_hide_missing_case(self):
        self.result["reviews"][1]["id"] = "a"
        with self.assertRaises(ValueError):
            validate_reviews(self.result, self.packet)

    def test_approval_is_not_an_allowed_worker_verdict(self):
        self.result["reviews"][0]["verdict"] = "approved"
        with self.assertRaises(ValueError):
            validate_reviews(self.result, self.packet)

    def test_duplicate_input_is_rejected(self):
        self.packet["cases"][1]["id"] = "a"
        with self.assertRaises(ValueError):
            validate_reviews(self.result, self.packet)

    def test_transport_requires_the_whole_user_message(self):
        prompt = "Evidence\n" + "x" * 4000 + "\nEND"
        exported = {"messages": [{"info": {"role": "user"}, "parts": [{"type": "text", "text": prompt[:2000]}]}]}
        self.assertFalse(input_is_complete(exported, prompt))
        exported["messages"][0]["parts"][0]["text"] = prompt.replace("\n", "\r\n")
        self.assertTrue(input_is_complete(exported, prompt))

    def test_wrapped_cross_reference_does_not_truncate_occupation_notes(self):
        text = "1111 Primera ocupación\nTareas.\nExclusiones: otro grupo\n2222\nTexto de la exclusión.\n2222 Segunda ocupación\nMás tareas.\nAnexo I\n1111 Cambio histórico"
        sections = cno_sections(text)
        self.assertEqual(set(sections), {"1111", "2222"})
        self.assertIn("Texto de la exclusión", sections["1111"])
        self.assertNotIn("Cambio histórico", sections["1111"])


if __name__ == "__main__":
    unittest.main()
