import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { validateFpOneWordPublicationReview } from "./validateFpOneWordPublicationReview";

export function assertRenderedFpOneWordPublicationReview(
  actual: string,
  expected: string,
): void {
  if (actual !== expected)
    throw new Error(
      "FP one-word publication review is not the validated rendered output.",
    );
}

export function renderFpOneWordPublicationReview(root: string): string {
  const artifact = validateFpOneWordPublicationReview(root);
  const forms = [
    "cocinero",
    "cocineros",
    "albañil",
    "albañiles",
    "encofradores",
  ] as const;
  const plural = (count: number, word: string) =>
    `${count} ${word}${count === 1 ? "" : "s"}`;
  const counts = forms.map((form) => {
    const rows = artifact.rows.filter((row) => row.form === form);
    const accepted = rows.filter(
      (row) => row.disposition === "accepted",
    ).length;
    return `- \`${form}\`: ${plural(accepted, "aceptada")}; ${plural(rows.length - accepted, "rechazada")}.`;
  });
  const rejected = artifact.rows
    .filter((row) => row.disposition === "rejected")
    .map(
      (row) => `- \`${row.offerId}\` — ${row.offerTitle} (${row.reasonCode}).`,
    );
  return `# Auditoría de publicación FP de coincidencias de una palabra

## Resultado

67 ofertas auditadas.
${counts.join("\n")}

## Colisiones rechazadas

${rejected.join("\n")}

## Límite y decisión

No se aprueba ninguna regla general de coincidencia de una sola palabra. No se propone ninguna lista negra por ID de oferta.

Solo \`encofradores\` puede publicarse condicionalmente tras la política acotada posterior; \`cocinero\`, \`cocineros\`, \`albañil\` y \`albañiles\` no se publican porque contienen colisiones rechazadas conocidas.
`;
}

if (process.argv[1]?.endsWith("renderFpOneWordPublicationReview.ts")) {
  const root = resolve(process.cwd());
  const expected = renderFpOneWordPublicationReview(root);
  const output = resolve(root, "analysis/fp_one_word_publication_reviews.md");
  if (process.argv.includes("--write")) writeFileSync(output, expected, "utf8");
  else
    assertRenderedFpOneWordPublicationReview(
      readFileSync(output, "utf8"),
      expected,
    );
}
