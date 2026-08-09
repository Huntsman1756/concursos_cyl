import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  FpOfficialAliasPassResultsSchema,
  ProgramOfficialAliasReviewSchema,
  TARGET_ALIAS_PROGRAMS,
} from "../../data/schemas/fpOfficialAliasPass";
import { GeneratedManifestSchema } from "../../data/schemas/generated";

export function assertRenderedFpOfficialAliasPassReport(
  actual: string,
  expected: string,
): void {
  if (actual !== expected) {
    throw new Error(
      "FP official alias pass report is not the validated rendered output.",
    );
  }
}

export function renderFpOfficialAliasPassReport(
  results: unknown,
  manifest: unknown,
  audits: readonly unknown[],
): string {
  const validated = FpOfficialAliasPassResultsSchema.parse(results);
  const published = GeneratedManifestSchema.parse(manifest);
  const validatedAudits = audits.map((audit) =>
    ProgramOfficialAliasReviewSchema.parse(audit),
  );
  const auditByProgram = new Map(
    validatedAudits.map((audit) => [audit.programKey, audit]),
  );
  if (
    validatedAudits.length !== TARGET_ALIAS_PROGRAMS.length ||
    auditByProgram.size !== TARGET_ALIAS_PROGRAMS.length ||
    !TARGET_ALIAS_PROGRAMS.every((programKey) => auditByProgram.has(programKey))
  ) {
    throw new Error(
      "The report requires exactly one audit per target program.",
    );
  }
  const auditCounts = TARGET_ALIAS_PROGRAMS.map((programKey) => {
    const audit = auditByProgram.get(programKey)!;
    return {
      programKey,
      accepted: audit.reviews.filter(
        (review) => review.disposition === "accepted",
      ).length,
      rejected: audit.reviews.filter(
        (review) => review.disposition === "rejected",
      ).length,
    };
  }).toSorted((left, right) => left.programKey.localeCompare(right.programKey));
  const acceptedFromAudits = auditCounts.reduce(
    (sum, counts) => sum + counts.accepted,
    0,
  );
  const rejectedFromAudits = auditCounts.reduce(
    (sum, counts) => sum + counts.rejected,
    0,
  );
  if (
    acceptedFromAudits !== validated.acceptedAliasCount ||
    rejectedFromAudits !== validated.rejectedAliasCount
  ) {
    throw new Error(
      "Aggregate accepted/rejected results do not agree with the validated audits.",
    );
  }
  const lines = validated.programs
    .toSorted((left, right) => left.programKey.localeCompare(right.programKey))
    .map(
      (program) =>
        `- ${program.programKey}: ${program.beforeOfferCount} → ${program.afterOfferCount}.`,
    );
  const auditLines = auditCounts.map(
    ({ programKey, accepted, rejected }) =>
      `- ${programKey}: ${accepted} ${accepted === 1 ? "aceptado" : "aceptados"}; ${rejected} ${rejected === 1 ? "rechazado" : "rechazados"}.`,
  );
  const decision =
    validated.newlyReachedOfferUnionCount === 0
      ? "La pasada oficial acotada no aumenta las ofertas alcanzadas; no se amplían fuentes, CNO, ciclos ni reglas de coincidencia."
      : `La pasada oficial acotada aumenta en ${validated.newlyReachedOfferUnionCount} las ofertas alcanzadas mediante los alias validados; no se amplían fuentes, CNO, ciclos ni reglas de coincidencia.`;
  return `# Pasada oficial de alias FP

## Resultado controlado

- Instantánea base: \`${validated.baselineSnapshotId}\`.
- Alias aceptados: ${validated.acceptedAliasCount}; rechazados: ${validated.rejectedAliasCount}.
${lines.join("\n")}
- Unión de ofertas nuevas: ${validated.newlyReachedOfferUnionCount}.

## Alias aceptados y rechazados

${auditLines.join("\n")}

## Publicación

- Instantánea publicada: \`${published.resourceSnapshots.programs.resourcePath.split("/").at(-2)}\`.
- Recursos publicados: ${published.resourceSnapshots.programs.recordCount} programas, ${published.resourceSnapshots.occupations.recordCount} ocupaciones, ${published.resourceSnapshots.occupationAliases.recordCount} alias y ${published.resourceSnapshots.trainingOccupationLinks.recordCount} relaciones.

## Límites

Los recuentos corresponden a la instantánea controlada y no estiman el empleo total.

## Decisión

${decision}
`;
}

async function run(): Promise<void> {
  const root = process.cwd();
  const results = JSON.parse(
    await readFile(
      resolve(root, "analysis/fp_official_alias_pass_results.json"),
      "utf8",
    ),
  );
  const manifest = JSON.parse(
    await readFile(resolve(root, "public/data/v1/manifest.json"), "utf8"),
  );
  const audits = await Promise.all(
    TARGET_ALIAS_PROGRAMS.map(async (programKey) =>
      JSON.parse(
        await readFile(
          resolve(
            root,
            "analysis",
            "fp_official_alias_pass",
            `${programKey}.json`,
          ),
          "utf8",
        ),
      ),
    ),
  );
  const expected = renderFpOfficialAliasPassReport(results, manifest, audits);
  const output = resolve(root, "analysis/fp_official_alias_pass_results.md");
  if (process.argv[2] === "--write") {
    await writeFile(output, expected, "utf8");
    return;
  }
  assertRenderedFpOfficialAliasPassReport(
    await readFile(output, "utf8"),
    expected,
  );
}

if (
  process.argv[1] !== undefined &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  await run();
}
