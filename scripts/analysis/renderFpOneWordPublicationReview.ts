import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { validateFpOneWordPublicationReview } from "./validateFpOneWordPublicationReview";
import type { FpOneWordPublicationReview } from "../../data/schemas/fpOneWordPublicationReview";

export function assertRenderedFpOneWordPublicationReview(
  actual: string,
  expected: string,
): void {
  if (actual !== expected)
    throw new Error(
      "FP one-word publication review is not the validated rendered output.",
    );
}

export function renderValidatedFpOneWordPublicationReview(
  artifact: FpOneWordPublicationReview,
): string {
  const forms = [
    "cocinero",
    "cocineros",
    "albañil",
    "albañiles",
    "encofradores",
    "teleoperadores",
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
  const publishable = forms.filter(
    (form) => artifact.publicationDecision[form].status === "accepted",
  );
  const blocked = forms.filter(
    (form) => artifact.publicationDecision[form].status === "rejected",
  );
  return `# Auditoría de publicación FP de coincidencias de una palabra

## Resultado

${artifact.rows.length} ofertas auditadas.

${counts.join("\n")}

## Colisiones rechazadas

${rejected.join("\n")}

## Límite y decisión

No se aprueba ninguna regla general de coincidencia de una sola palabra. No se propone ninguna lista negra por ID de oferta.

${publishable.length > 0 ? `Solo ${publishable.map((form) => `\`${form}\``).join(", ")} ${publishable.length === 1 ? "puede" : "pueden"} publicarse condicionalmente tras la política acotada posterior.` : "Ninguna forma puede publicarse condicionalmente."} ${blocked.map((form) => `\`${form}\``).join(", ")} no se publican porque contienen colisiones rechazadas conocidas.
`;
}

export function renderFpOneWordPublicationReview(root: string): string {
  return renderValidatedFpOneWordPublicationReview(
    validateFpOneWordPublicationReview(root),
  );
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
