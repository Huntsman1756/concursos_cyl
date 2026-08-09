import fs from "node:fs";
import path from "node:path";

const CLAIM_KEYS = [
  "claimId",
  "text",
  "status",
  "evidenceType",
  "evidenceRef",
  "allowedDocuments",
  "forbiddenParaphrases",
] as const;
const EVIDENCE_TYPES = [
  "source_url",
  "manifest_field",
  "test",
  "workflow_run",
  "human_confirmation",
] as const;
const SCAN_PATTERNS = [
  /salario\s+esperado/iu,
  /(?:tasa|indicador)\s+de\s+(?:empleo|afiliaci[oó]n)/iu,
  /(?:cobertura|coverage)[^\n]{0,30}\b67\b/iu,
  /\b67\b[^\n]{0,30}(?:cobertura|coverage)/iu,
  /EDUCAbase[^\n]{0,30}CC\s*BY/iu,
  /CC\s*BY[^\n]{0,30}EDUCAbase/iu,
  /(?:endors|endorsement|respaldo|aval(?:a|ado|ada)?)[^\n]{0,40}(?:Junta|Ministerio|oficial)/iu,
  /(?:submitted|submitted\s+url|url\s+enviada|url\s+de\s+presentaci[oó]n)[^\n]{0,80}https?:\/\/[^\s)]+\/(?:desde-fp|comparar|metodologia)\/?[^\s)]*/iu,
];

export type ContestClaim = {
  claimId: string;
  text: string;
  status: "invariant" | "freeze_derived";
  evidenceType: (typeof EVIDENCE_TYPES)[number];
  evidenceRef: string;
  allowedDocuments: string[];
  forbiddenParaphrases: string[];
};

type DocumentInput = { path: string; text: string };
type ValidationOptions = { documents?: DocumentInput[] };

export function validateContestClaims(
  claims: unknown,
  options: ValidationOptions = {},
): { valid: true; errors: [] } {
  if (!Array.isArray(claims)) throw new Error("claims must be an array");
  const ids = new Set<string>();
  for (const claim of claims) {
    if (!claim || typeof claim !== "object" || Array.isArray(claim)) {
      throw new Error("claim must be an object");
    }
    const record = claim as Record<string, unknown>;
    const unknown = Object.keys(record).filter(
      (key) => !CLAIM_KEYS.includes(key as never),
    );
    if (unknown.length) throw new Error(`unknown field: ${unknown.join(", ")}`);
    for (const key of CLAIM_KEYS) {
      if (!(key in record)) throw new Error(`missing ${key}`);
    }
    if (
      typeof record.claimId !== "string" ||
      !/^[a-z][a-z0-9_-]*$/u.test(record.claimId)
    )
      throw new Error("invalid claimId");
    if (ids.has(record.claimId))
      throw new Error(`duplicate claimId: ${record.claimId}`);
    ids.add(record.claimId);
    if (typeof record.text !== "string" || !record.text.trim())
      throw new Error("invalid text");
    if (record.status !== "invariant" && record.status !== "freeze_derived")
      throw new Error("invalid status");
    if (
      !EVIDENCE_TYPES.includes(
        record.evidenceType as (typeof EVIDENCE_TYPES)[number],
      )
    )
      throw new Error("invalid evidenceType");
    if (typeof record.evidenceRef !== "string" || !record.evidenceRef.trim())
      throw new Error("evidenceRef is required");
    if (
      record.evidenceType === "source_url" &&
      !/^https:\/\/[^\s]+$/u.test(record.evidenceRef)
    )
      throw new Error("source_url evidenceRef must be an HTTPS URL");
    if (
      !Array.isArray(record.allowedDocuments) ||
      record.allowedDocuments.length === 0 ||
      record.allowedDocuments.some(
        (item) =>
          typeof item !== "string" ||
          item.length === 0 ||
          path.isAbsolute(item) ||
          item.split(/[\\/]/u).includes(".."),
      )
    )
      throw new Error("invalid allowedDocuments");
    if (
      !Array.isArray(record.forbiddenParaphrases) ||
      record.forbiddenParaphrases.some(
        (item) => typeof item !== "string" || !item.trim(),
      )
    )
      throw new Error("invalid forbiddenParaphrases");
    if (record.status === "freeze_derived") {
      if (/\b\d+(?:[.,]\d+)?\b/iu.test(record.text))
        throw new Error("provisional numeric text in freeze-derived claim");
      if (!/\{[a-z][a-zA-Z0-9]*(?:\.[a-z][a-zA-Z0-9]*)+\}/u.test(record.text))
        throw new Error("freeze-derived claim must use a symbolic token");
      if (
        !/^[a-z][a-zA-Z0-9]*(?:\.[a-z][a-zA-Z0-9]*)+$/u.test(record.evidenceRef)
      )
        throw new Error("freeze-derived evidenceRef must be symbolic");
    }
    if (
      /salari[oa]\s+esperad|(?:tasa|indicador)\s+de\s+(?:empleo|afiliaci[oó]n)/iu.test(
        record.text,
      )
    )
      throw new Error("salary/employment claim is forbidden");
    if (
      /https?:\/\/[^\s)]+\/(?:desde-fp|comparar|metodologia)\/?[^\s)]*/iu.test(
        record.text,
      )
    )
      throw new Error("deep-link primary URL is forbidden");
  }
  for (const document of options.documents ?? []) {
    for (const pattern of SCAN_PATTERNS) {
      if (pattern.test(document.text))
        throw new Error(`forbidden claim in ${document.path}: ${pattern}`);
    }
    const lowerText = document.text.toLocaleLowerCase("es-ES");
    for (const claim of claims as ContestClaim[]) {
      for (const phrase of claim.forbiddenParaphrases) {
        if (lowerText.includes(phrase.toLocaleLowerCase("es-ES")))
          throw new Error(
            `forbidden paraphrase in ${document.path}: ${phrase}`,
          );
      }
    }
  }
  return { valid: true, errors: [] };
}

export function loadAndValidateContestClaims(filePath: string): ContestClaim[] {
  const claims = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
  validateContestClaims(claims);
  return claims as ContestClaim[];
}

export function scanContestDocuments(
  rootDir: string,
  relativePaths: string[],
): void {
  validateContestClaims([], {
    documents: relativePaths.map((relativePath) => ({
      path: relativePath,
      text: fs.readFileSync(path.join(rootDir, relativePath), "utf8"),
    })),
  });
}

export function validateContestClaimsFromRoot(rootDir = process.cwd()): void {
  const claims = loadAndValidateContestClaims(
    path.join(rootDir, "docs", "contest", "claim-ledger.json"),
  );
  scanContestDocuments(rootDir, [
    "README.md",
    "docs/contest/source-ledger.md",
    "docs/methodology/educabase-income.md",
    "analysis/fp_coverage_expansion_results.md",
    "analysis/fp_coverage_pilot_results.md",
    "analysis/fp_official_alias_pass_results.md",
  ]);
  if (claims.length < 1) throw new Error("claim ledger must not be empty");
}

if (
  path.resolve(process.argv[1] ?? "") === path.resolve(import.meta.filename)
) {
  validateContestClaimsFromRoot();
  console.info("Contest claim ledger satisfies the validation contract.");
}
