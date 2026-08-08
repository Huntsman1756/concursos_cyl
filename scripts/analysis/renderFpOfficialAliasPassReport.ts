import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { FpOfficialAliasPassResultsSchema } from "../../data/schemas/fpOfficialAliasPass";
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
): string {
  const validated = FpOfficialAliasPassResultsSchema.parse(results);
  const published = GeneratedManifestSchema.parse(manifest);
  const lines = validated.programs
    .toSorted((left, right) => left.programKey.localeCompare(right.programKey))
    .map(
      (program) =>
        `- ${program.programKey}: ${program.beforeOfferCount} → ${program.afterOfferCount}.`,
    );
  return `# Pasada oficial de alias FP

## Resultado controlado

- Instantánea base: \`${validated.baselineSnapshotId}\`.
- Alias aceptados: ${validated.acceptedAliasCount}; rechazados: ${validated.rejectedAliasCount}.
${lines.join("\n")}
- Unión de ofertas nuevas: ${validated.newlyReachedOfferUnionCount}.

## Publicación

- Instantánea publicada: \`${published.resourceSnapshots.programs.resourcePath.split("/").at(-2)}\`.
- Recursos publicados: ${published.resourceSnapshots.programs.recordCount} programas, ${published.resourceSnapshots.occupations.recordCount} ocupaciones, ${published.resourceSnapshots.occupationAliases.recordCount} alias y ${published.resourceSnapshots.trainingOccupationLinks.recordCount} relaciones.

## Límites

Los recuentos corresponden a la instantánea controlada y no estiman el empleo total.

## Decisión

La pasada oficial acotada no aumenta las ofertas alcanzadas; no se amplían fuentes, CNO, ciclos ni reglas de coincidencia.
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
  const expected = renderFpOfficialAliasPassReport(results, manifest);
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
