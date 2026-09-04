import type { OutcomeMeasure } from "../../../data/schemas/outcomes";

export interface OutcomeMeasurePresentation {
  plainLabel: string;
  technicalLabel: string;
  explanation: string;
  percentile: number | null;
}

export const OUTCOME_MEASURE_ORDER: readonly OutcomeMeasure[] = [
  "mean",
  "quintile_20_lower_boundary",
  "quintile_40_lower_boundary",
  "quintile_60_lower_boundary",
  "quintile_80_lower_boundary",
];

export const OUTCOME_MEASURE_PRESENTATION: Readonly<
  Record<OutcomeMeasure, OutcomeMeasurePresentation>
> = {
  mean: {
    plainLabel: "Media anual",
    technicalLabel: "Media",
    explanation: "Promedio observado para el conjunto de titulados.",
    percentile: null,
  },
  quintile_20_lower_boundary: {
    plainLabel: "Corte del 20 %",
    technicalLabel: "Límite inferior del segundo quintil",
    explanation: "El 20 % queda por debajo de este importe.",
    percentile: 20,
  },
  quintile_40_lower_boundary: {
    plainLabel: "Corte del 40 %",
    technicalLabel: "Límite inferior del tercer quintil",
    explanation: "El 40 % queda por debajo de este importe.",
    percentile: 40,
  },
  quintile_60_lower_boundary: {
    plainLabel: "Corte del 60 %",
    technicalLabel: "Límite inferior del cuarto quintil",
    explanation: "El 60 % queda por debajo de este importe.",
    percentile: 60,
  },
  quintile_80_lower_boundary: {
    plainLabel: "Corte del 80 %",
    technicalLabel: "Límite inferior del quinto quintil",
    explanation: "El 80 % queda por debajo de este importe.",
    percentile: 80,
  },
};

/**
 * Word-level display corrections for known defects in the Educabase source
 * labels. The canonical snapshot value is never mutated; only the text we
 * present is corrected, so matching and URLs keep using the raw value.
 */
const OUTCOME_ORTHOGRAPHY_CORRECTIONS: ReadonlyArray<
  readonly [RegExp, string]
> = [
  [/\bcitodiagnostico\b/gu, "citodiagnóstico"],
  [/\bclinico\b/gu, "clínico"],
  [/\bfarmaceuticos\b/gu, "farmacéuticos"],
  [/\bfarmaceutico\b/gu, "farmacéutico"],
  [/\bradioterampia\b/gu, "radioterapia"],
];

/** Normalizes source casing and orthography for display, not the source value. */
export function formatOutcomeLabel(value: string): string {
  const trimmed = value.trim().replace(/\s+/gu, " ");
  if (trimmed === "") return trimmed;
  const lower = trimmed.toLocaleLowerCase("es-ES");
  const corrected = OUTCOME_ORTHOGRAPHY_CORRECTIONS.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    lower,
  );
  const sentence = `${corrected[0].toLocaleUpperCase("es-ES")}${corrected.slice(1)}`;
  return sentence.replace(/\b(?:logse|fp|bim)\b/giu, (match) =>
    match.toLocaleUpperCase("es-ES"),
  );
}
