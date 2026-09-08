"""Extract exact principal-label candidates from the official SISPE PDF.

Requires pdfplumber. This prepares evidence, never approves or publishes links.
The crop is specific to the pinned SEPE catalogue; alternate-label columns are
excluded so that adjacent synonyms cannot be mistaken for a principal label.
"""
import argparse
import collections
import hashlib
import json
import re
from pathlib import Path

import pdfplumber


def normalize(text):
    return " ".join(text.upper().split())


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    digest = hashlib.sha256(args.pdf.read_bytes()).hexdigest()
    if digest != "b8d7c02e849ff0133ee01e9e04c183218824b265ad9dadc90113834ed100cddd":
        raise ValueError("Unreviewed catalogue layout: inspect it before changing the pinned hash/crop")
    rows = []
    with pdfplumber.open(args.pdf) as pdf:
        for number, page in enumerate(pdf.pages, 1):
            words = page.extract_words()
            # Codes are vertically centred beside multiline labels. Reading text
            # line-by-line can attach the first label line to the previous code.
            anchors = [w for w in words if 50 <= w["x0"] < 83
                       and re.fullmatch(r"\d{1,8}", w["text"])]
            for anchor in anchors:
                if len(anchor["text"]) != 8:
                    continue
                label_words = [w for w in words if 88 <= w["x0"] < 337
                               and min(anchors, key=lambda a: abs(a["top"] - w["top"])) is anchor]
                label_words.sort(key=lambda w: (round(w["top"], 1), w["x0"]))
                rows.append({"code": anchor["text"],
                             "label": " ".join(w["text"] for w in label_words), "page": number})
    by_label = collections.defaultdict(list)
    for row in rows:
        by_label[normalize(row["label"])].append(row)
    read = lambda path: json.loads(path.read_text(encoding="utf-8"))
    manifest = read(Path("public/data/v1/manifest.json"))
    offers = read(Path("public" + manifest["resourceSnapshots"]["jobOffers"]["resourcePath"]))
    links = read(Path("data/curated/training-occupation-links.json"))
    titles = collections.Counter(offer["title"] for offer in offers)
    candidates = []
    for title, count in titles.most_common():
        matches = by_label.get(normalize(title), [])
        codes = {row["code"][:4] for row in matches}
        if len(codes) != 1:
            continue
        code = next(iter(codes))
        programmes = sorted({link["trainingProgramKey"] for link in links
                             if link["reviewStatus"] == "approved"
                             and link["occupationId"] == "occupation:cno11:" + code})
        candidates.append({"offerTitle": title, "offerCount": count, "cnoCode": code,
                           "catalogueRows": matches, "relatedProgrammeKeys": programmes,
                           "publicationApproved": False})
    result = {"status": "exact-label-candidates-awaiting-review", "publicationApproved": False,
              "sourceUrl": "https://www.sepe.es/ca/SiteSepe/contenidos/empresas/contratos_trabajo/comunicar_contratacion/pdf/ocupaciones.pdf",
              "sourceSha256": digest, "sourceEdition": "2018 catalogue; retrieval is not an update date",
              "extractedRows": len(rows), "candidates": candidates}
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"rows": len(rows), "matchingTitles": len(candidates),
                      "titlesWithFpLinks": sum(bool(c["relatedProgrammeKeys"]) for c in candidates)}))


if __name__ == "__main__":
    main()
