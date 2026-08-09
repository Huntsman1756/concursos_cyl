import type {
  ParsedIncomeCell,
  ParsedIncomeTable,
} from "./parseEducabaseIncomeCsv";

function canonicalCoordinate(
  cell: ParsedIncomeCell,
  names: readonly string[],
): string {
  return names.map((name) => cell.dimensions[name]).join("\0");
}

function canonicalCsvValue(rawValue: string): number | null {
  if (rawValue === "..") return null;
  if (!/^[0-9]+(?:\.[0-9]{3})*$/u.test(rawValue)) {
    throw new Error(`CSV numeric token is invalid: ${rawValue}`);
  }
  return Number.parseInt(rawValue.replaceAll(".", ""), 10);
}

function canonicalPxCents(rawValue: string): number | null {
  if (rawValue === "..") return null;
  if (!/^[0-9]+(?:\.[0-9]{1,2})?$/u.test(rawValue)) {
    throw new Error(`PX numeric token is invalid: ${rawValue}`);
  }
  const [whole, fraction = ""] = rawValue.split(".") as [string, string?];
  const cents =
    Number.parseInt(whole, 10) * 100 +
    Number.parseInt(fraction.padEnd(2, "0"), 10);
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new Error(
      `PX numeric token is not a non-negative euro amount: ${rawValue}`,
    );
  }
  return cents;
}

function assertDimensionsEqual(
  csv: ParsedIncomeTable,
  px: ParsedIncomeTable,
): void {
  if (csv.dimensions.length !== px.dimensions.length) {
    throw new Error(`${csv.tableId} CSV/PX dimension count differs`);
  }
  for (const [index, csvDimension] of csv.dimensions.entries()) {
    const pxDimension = px.dimensions[index];
    if (
      !pxDimension ||
      csvDimension.name !== pxDimension.name ||
      csvDimension.values.length !== pxDimension.values.length ||
      csvDimension.values.some(
        (value, valueIndex) => value !== pxDimension.values[valueIndex],
      )
    ) {
      throw new Error(`${csv.tableId} CSV/PX dimension ${index} differs`);
    }
  }
}

function assertObservationNote(note: string, tableId: string): void {
  if (
    !note.includes("2021-2022") ||
    !note.includes("2022-2023") ||
    !/3 años/u.test(note) ||
    !/2 años/u.test(note)
  ) {
    throw new Error(
      `${tableId} PX note does not preserve the approved observation windows`,
    );
  }
}

/** Fails closed unless independent CSV and PC-Axis inputs describe identical income cells. */
export function assertEquivalentIncomeTables(
  csv: ParsedIncomeTable,
  px: ParsedIncomeTable,
): void {
  if (csv.tableId !== px.tableId) throw new Error("CSV/PX table IDs differ");
  assertDimensionsEqual(csv, px);
  assertObservationNote(px.note, csv.tableId);
  if (csv.cells.length !== px.cells.length) {
    throw new Error(`${csv.tableId} CSV/PX cell count differs`);
  }
  const names = csv.dimensions.map((dimension) => dimension.name);
  for (const [index, csvCell] of csv.cells.entries()) {
    const pxCell = px.cells[index];
    if (
      !pxCell ||
      canonicalCoordinate(csvCell, names) !== canonicalCoordinate(pxCell, names)
    ) {
      throw new Error(
        `${csv.tableId} CSV/PX coordinate differs at cell ${index}`,
      );
    }
    const csvValue = canonicalCsvValue(csvCell.rawValue);
    const pxValue = canonicalPxCents(pxCell.rawValue);
    const valuesMatch =
      csvValue === null
        ? pxValue === null
        : pxValue !== null && Math.floor((pxValue + 50) / 100) === csvValue;
    if (!valuesMatch) {
      throw new Error(
        `${csv.tableId} cell ${index} differs: csv=${csvCell.rawValue}; px=${pxCell.rawValue}`,
      );
    }
  }
}
