"""Summarize completed worker reviews without promoting model votes to evidence."""
import argparse
import collections
import datetime
import hashlib
import json
from pathlib import Path


def normalize(text):
    return " ".join(text.split())


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--packets", type=Path, required=True)
    parser.add_argument("--results", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    cases, failures = [], []
    for packet in sorted(args.packets.glob("*.json")):
        payload = json.loads(packet.read_text(encoding="utf-8"))
        if not all("mapping" in case for case in payload["cases"]):
            continue
        digest = hashlib.sha256(packet.read_bytes()).hexdigest()
        results = {}
        for model in ["qwen", "gemma"]:
            path = args.results / f"{packet.stem}.{model}.json"
            result = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
            if (result.get("status") != "completed" or result.get("inputSha256") != digest
                    or result.get("inputIntegrityVerified") is not True):
                failures.append({"packet": packet.name, "model": model, "status": result.get("status", "missing")})
                continue
            results[model] = {r["id"]: r for r in result["result"]["reviews"]}
        for case in payload["cases"]:
            reviews = {}
            fp_text = normalize(" ".join(case.get("sourceEvidence", {}).get("excerpts", [])))
            cno_text = normalize(case.get("occupationEvidence", {}).get("text", ""))
            for model, indexed in results.items():
                review = dict(indexed[case["id"]])
                quote = normalize(review.get("evidenceQuote", ""))
                review["quoteFoundInFpExcerpt"] = bool(quote) and quote in fp_text
                review["quoteFoundInCnoNotes"] = bool(quote) and quote in cno_text
                reviews[model] = review
            verdicts = [r["verdict"] for r in reviews.values()]
            cases.append({"id": case["id"], "mapping": case.get("mapping"), "packetSha256": digest,
                          "reviews": reviews, "twoReviewsComplete": len(reviews) == 2,
                          "modelsAgree": len(reviews) == 2 and len(set(verdicts)) == 1,
                          "publicationApproved": False})
    tally = collections.Counter(r["verdict"] for c in cases for r in c["reviews"].values())
    report = {"generatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
              "status": "review-complete-awaiting-adjudication" if not failures else "review-incomplete",
              "publicationApproved": False, "caseCount": len(cases),
              "completedReviewCount": sum(len(c["reviews"]) for c in cases),
              "workerVerdictsNotAccuracyMetrics": dict(tally), "failures": failures, "cases": cases}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: report[k] for k in ["status", "caseCount", "completedReviewCount", "workerVerdictsNotAccuracyMetrics"]}))


if __name__ == "__main__":
    main()
