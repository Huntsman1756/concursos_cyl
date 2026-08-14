import type { OutcomeIndicator } from "../../data/schemas/generated";

export interface OutcomeCellContext extends Omit<
  OutcomeIndicator,
  "value" | "suppressionState"
> {
  rawValue?: string | number | null;
}

export function normalizeCell(
  rawValue: string | number | null,
  context: OutcomeCellContext,
): OutcomeIndicator {
  if (rawValue === ".." || rawValue === null || rawValue === undefined) {
    return { ...context, value: null, suppressionState: "not_published" };
  }
  if (rawValue === ":" || rawValue === "-" || rawValue === "—") {
    return { ...context, value: null, suppressionState: "not_applicable" };
  }
  if (rawValue === "...") {
    return { ...context, value: null, suppressionState: "provisional" };
  }
  const value =
    typeof rawValue === "number"
      ? rawValue
      : Number(
          rawValue.includes(",")
            ? rawValue.replace(/\s/g, "").replace(/\./g, "").replace(",", ".")
            : rawValue.replace(/\s/g, ""),
        );
  if (!Number.isFinite(value)) {
    return { ...context, value: null, suppressionState: "not_published" };
  }
  return { ...context, value, suppressionState: "published" };
}
