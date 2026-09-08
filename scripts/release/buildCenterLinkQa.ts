import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Builds the PRESENTATION-LAYER center website CTA policy artifact from the
 * design-phase link audit (analysis/centers-link-audit.json).
 *
 * This artifact is NOT canonical source data: it never enters public/data/v1
 * or the snapshots. It is a dated QA/presentation overlay derived from the
 * audit and consumed by the centers screens to decide whether a "Web del
 * centro" / "Web publicada en la fuente" CTA may be shown.
 *
 * Usage: npx tsx scripts/release/buildCenterLinkQa.ts
 */

interface AuditCenterRow {
  centerCode: string;
  classification: string;
  identity: { level: string; matchedIn: string | null };
  ctaLabel: string | null;
  safeWebsiteCta: boolean;
}

interface LinkAudit {
  auditedAt: string;
  finishedAt: string;
  snapshotId: string;
  counts: Record<string, number>;
  identityCounts: Record<string, number>;
  CENTERS_WITH_SAFE_WEBSITE_CTA: number;
  centers: AuditCenterRow[];
}

const root = process.cwd();
const auditPath = join(root, "analysis", "centers-link-audit.json");
const outPath = join(root, "public", "qa", "center-link-policy.json");

const audit = JSON.parse(readFileSync(auditPath, "utf8")) as LinkAudit;

if (audit.snapshotId !== "20260830120000000-8c6c79fbd2a1") {
  throw new Error(
    `Link audit was produced for a different snapshot: ${audit.snapshotId}`,
  );
}

const SAFE_CLASSIFICATIONS = new Set([
  "SOURCE_PUBLISHED_LIVE",
  "SOURCE_PUBLISHED_REDIRECTED",
  "SOURCE_PUBLISHED_HTTP_ONLY",
]);
const SAFE_IDENTITY_LEVELS = new Set([
  "IDENTITY_CONFIRMED",
  "IDENTITY_PLAUSIBLE",
  "IDENTITY_NOT_CONFIRMED",
]);

const centers: Record<
  string,
  { cta: string; classification: string; identity: string }
> = {};
let safeCount = 0;
for (const row of audit.centers) {
  const safe =
    SAFE_CLASSIFICATIONS.has(row.classification) &&
    SAFE_IDENTITY_LEVELS.has(row.identity.level) &&
    row.safeWebsiteCta;
  if (!safe) continue;
  safeCount += 1;
  centers[row.centerCode] = {
    cta:
      row.ctaLabel === "Web publicada en la fuente"
        ? "source_published"
        : "website",
    classification: row.classification,
    identity: row.identity.level,
  };
}

if (safeCount !== audit.CENTERS_WITH_SAFE_WEBSITE_CTA) {
  throw new Error(
    `Safe CTA recomputation mismatch: ${safeCount} != ${audit.CENTERS_WITH_SAFE_WEBSITE_CTA}`,
  );
}

const artifact = {
  kind: "salida-cyl-center-link-policy",
  version: "1.0.0",
  derivedFrom: "analysis/centers-link-audit.json",
  auditedAt: audit.auditedAt,
  finishedAt: audit.finishedAt,
  snapshotId: audit.snapshotId,
  policy: {
    website: "Web del centro",
    sourcePublished: "Web publicada en la fuente",
    note: "Los enlaces se muestran tal como los publica la fuente. Disponibilidad e identidad verificadas en la auditoría fechada; no es una garantía continua.",
  },
  centers,
};

mkdirSync(join(root, "public", "qa"), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(
  `written ${outPath} — ${safeCount} safe CTAs of ${audit.centers.length} audited centers`,
);
