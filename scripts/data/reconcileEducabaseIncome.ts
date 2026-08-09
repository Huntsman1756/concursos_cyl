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

function canonicalValue(rawValue: string, source: "csv" | "px"): number | null {
  if (rawValue === "..") return null;
  if (source === "csv") {
    if (!/^[0-9]+(?:\.[0-9]{3})*$/u.test(rawValue)) {
      throw new Error(`CSV numeric token is invalid: ${rawValue}`);
    }
    return Number.parseInt(rawValue.replaceAll(".", ""), 10);
  }
  if (!/^[0-9]+(?:\.[0-9]+)?$/u.test(rawValue)) {
    throw new Error(`PX numeric token is invalid: ${rawValue}`);
  }
  const value = Number(rawValue);
  if (!Number.isSafeInteger(Math.round(value)) || value < 0) {
    throw new Error(
      `PX numeric token is not a non-negative euro amount: ${rawValue}`,
    );
  }
  return Math.round(value);
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
    const csvValue = canonicalValue(csvCell.rawValue, "csv");
    const pxValue = canonicalValue(pxCell.rawValue, "px");
    if (csvValue !== pxValue) {
      throw new Error(
        `${csv.tableId} cell ${index} differs: csv=${csvCell.rawValue}; px=${pxCell.rawValue}`,
      );
    }
  }
}
