import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
const expected = [
  "docs/contest/jury-memo.md",
  "scripts/release/renderJuryMemoPdf.py",
  "config/publication.json",
  "public/candidatura.html",
  "public/candidatura.css",
  "public/candidatura.pdf",
];
const record = JSON.parse(
  await readFile("docs/contest/memo-artifacts.json", "utf8"),
);
if (
  record.schemaVersion !== 1 ||
  !Number.isInteger(record.pdfWords) ||
  record.pdfWords <= 0 ||
  record.pdfWords > 1000 ||
  JSON.stringify(Object.keys(record.sha256).sort()) !==
    JSON.stringify([...expected].sort())
)
  throw new Error("Invalid memo artifact inventory");
for (const path of expected) {
  const actual = createHash("sha256")
    .update(await readFile(path))
    .digest("hex");
  if (actual !== record.sha256[path])
    throw new Error(
      `Stale memo artifact: ${path}. Regenerate HTML/PDF with renderJuryMemoPdf.py.`,
    );
}
console.log(
  `Memo artifacts match source and renderer: ${record.pdfWords} words, ${record.pdfPages} PDF pages.`,
);
