"""Build source-backed review packets; never modify or approve curated mappings."""
import argparse
import hashlib
import json
import re
from pathlib import Path


def normalized(value):
    return " ".join(value.split())


def cno_sections(notes):
    notes = notes.split("Anexo I", 1)[0]
    headings = list(re.finditer(r"(?m)^[ \t]*(\d{4})[ \t]+([^\n]+)", notes))
    if len({heading[1] for heading in headings}) != len(headings):
        raise ValueError("Repeated CNO heading in the primary document body")
    return {
        heading[1]: normalized(notes[heading.start():headings[index + 1].start() if index + 1 < len(headings) else len(notes)])
        for index, heading in enumerate(headings)
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--sources", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--links", type=Path, help="Optional proposed mapping file; never published by this script")
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    read = lambda path: json.loads(path.read_text(encoding="utf-8"))
    links = read(args.links or args.root / "data/curated/training-occupation-links.json")
    manifest = read(args.root / "public/data/v1/manifest.json")
    programme_resource = manifest["resourceSnapshots"]["programs"]["resourcePath"]
    programmes_path = (args.root / "public" / programme_resource.lstrip("/")).resolve()
    if not programmes_path.is_relative_to((args.root / "public").resolve()):
        raise ValueError("Programme resource is outside public data")
    programs = {x["programKey"]: x for x in read(programmes_path)}
    occupations = {x["occupationId"]: x for x in read(args.root / "data/curated/official-occupations.json")}
    notes_url = "https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf"
    notes_key = hashlib.sha256(notes_url.encode()).hexdigest()[:20]
    notes = (args.sources / (notes_key + ".txt")).read_text(encoding="utf-8")
    notes_meta = read(args.sources / (notes_key + ".json"))
    # A cross-reference may put its code alone on a line. Do not let \s cross
    # that newline and misread the next paragraph as a new occupation heading.
    # The annex repeats changed entries; the main body contains all 502 codes.
    sections = cno_sections(notes)
    if len(sections) != 502:
        raise ValueError("Expected exactly 502 distinct primary CNO headings")
    cases = []
    for index, link in enumerate(links):
        key = hashlib.sha256(link["sourceUrl"].encode()).hexdigest()[:20]
        source = normalized((args.sources / (key + ".txt")).read_text(encoding="utf-8"))
        meta = read(args.sources / (key + ".json"))
        quote = normalized(link["sourceQuote"])
        position = source.find(quote)
        if position >= 0:
            excerpts = [source[max(0, position - 1400):position + len(quote) + 1800]]
        else:
            words = set(re.findall(r"\w{4,}", quote.casefold()))
            chunks = [source[start:start + 2200] for start in range(0, len(source), 1800)]
            excerpts = sorted(chunks, key=lambda chunk: len(words & set(re.findall(r"\w{4,}", chunk.casefold()))), reverse=True)[:3]
        code = occupations[link["occupationId"]]["classificationCode"]
        if code not in sections:
            raise ValueError("Missing official occupational notes: " + code)
        cases.append({"id": f"mapping-{index:03}", "mapping": link,
                      "program": programs.get(link["trainingProgramKey"], {"programKey": link["trainingProgramKey"], "notInCurrentSnapshot": True}),
                      "sourceEvidence": {"url": link["sourceUrl"], "sha256": meta["sha256"],
                                         "retrievedAt": meta["retrievedAt"], "normalizedQuoteFound": position >= 0,
                                         "excerpts": excerpts, "excerptsArePartial": True},
                      "occupationEvidence": {"code": code, "label": occupations[link["occupationId"]]["preferredLabel"],
                                             "url": notes_url, "sha256": notes_meta["sha256"], "text": sections[code]}})
    task = ("Audit the proposed FP-to-occupation relation using the supplied primary-source excerpts and CNO notes. "
            "supported means a defensible occupational relation, NOT a legal equivalence or employment guarantee. "
            "Check source quotation, occupational exclusions and assistant/adjacent functional boundaries. "
            "An official FP occupational output does not automatically establish the CNO code. "
            "Do not invent qualification-level exclusions or requirements absent from the supplied sources. "
            "If an assistant output is mapped to a full occupation, require a declared limited functional boundary. "
            "If the excerpts cannot establish the relation, return uncertain. A missing exact quote may be a source change; "
            "do not invent replacement text. Include a verbatim evidenceQuote from supplied text when supported. "
            "Never treat the existing approved status as evidence. Explain the decision in Spanish.")
    schema = {"reviews": [{"id": "case id", "verdict": "supported|unsupported|uncertain", "reason": "Spanish explanation",
                            "evidenceQuote": "verbatim supplied text or empty", "flags": ["specific issue if any"]}]}
    for start in range(0, len(cases), 6):
        packet = {"reviewTask": task, "outputSchema": schema, "cases": cases[start:start + 6]}
        (args.output / f"mappings-{start // 6:03}.json").write_text(json.dumps(packet, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"cases": len(cases), "packets": (len(cases) + 5) // 6,
                      "quotesNotFound": sum(not c["sourceEvidence"]["normalizedQuoteFound"] for c in cases),
                      "officialCodes": len(sections)}))


if __name__ == "__main__":
    main()
