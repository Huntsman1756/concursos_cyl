"""Validate candidate codes and literal source quotes; no semantic auto-approval."""
import argparse
import hashlib
import json
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--packets", type=Path, required=True)
    parser.add_argument("--results", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    programmes = []
    for path in sorted(args.packets.glob("expansion-*.json")):
        packet = json.loads(path.read_text(encoding="utf-8"))
        known = {x["code"] for x in packet["officialCatalogue"]}
        expected = hashlib.sha256(path.read_bytes()).hexdigest()
        results = {}
        for model in ["qwen", "gemma"]:
            result_path = args.results / (path.stem + "." + model + ".json")
            if not result_path.exists():
                continue
            result = json.loads(result_path.read_text(encoding="utf-8"))
            if (result.get("status") == "completed" and result.get("inputSha256") == expected
                    and result.get("inputIntegrityVerified") is True):
                results[model] = {x["id"]: x for x in result["result"]["reviews"]}
        for case in packet["cases"]:
            text = " ".join(case["sourceEvidence"]["text"].split())
            candidates = []
            for model, reviews in results.items():
                for candidate in reviews[case["id"]].get("candidates", []):
                    quote = " ".join(candidate.get("sourceQuote", "").split())
                    candidates.append({**candidate, "model": model,
                                       "codeExistsInOfficialCatalogue": candidate.get("code") in known,
                                       "quoteFoundInSource": bool(quote) and quote in text,
                                       "quoteFitsPublicationSchema": 10 <= len(quote) <= 280,
                                       "publicationApproved": False})
            programmes.append({"programKey": case["id"], "program": case["program"],
                               "sourceUrl": case["sourceEvidence"]["url"],
                               "sourceSha256": case["sourceEvidence"]["sha256"],
                               "twoReviewsComplete": len(results) == 2,
                               "candidates": candidates, "publicationApproved": False})
    report = {"status": "candidates-require-cno-notes-and-adjudication", "publicationApproved": False,
              "programmes": programmes}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"programmes": len(programmes), "twoReviewsComplete": sum(x["twoReviewsComplete"] for x in programmes),
                      "proposals": sum(len(x["candidates"]) for x in programmes)}))


if __name__ == "__main__":
    main()
