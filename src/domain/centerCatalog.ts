import type {
  EducationCenter,
  LegacyEducationCenter,
  LegacyTrainingOffering,
  TrainingOffering,
  TrainingProgram,
} from "../../data/schemas/generated";

export type CenterOwnership =
  "education" | "municipality" | "agriculture" | "private";

export interface CenterCatalogRow {
  rowKey: string;
  centerCode: string;
  centerName: string;
  centerAddress: string | null;
  centerOwnership: CenterOwnership | null;
  centerWebsite: string | null;
  province: string;
  locality: string;
  programKey: string;
  programTitle: string;
  level: TrainingProgram["level"];
  familyCode: string;
  familyName: string;
  modalities: string[];
  teachingTypes: string[];
}

type CenterInput = EducationCenter | LegacyEducationCenter;

export interface CenterCatalogFilters {
  query?: string;
  province?: string;
  modalidad?: string;
  titularidad?: string;
  nivel?: string;
  familia?: string;
  ownership?: string;
}

export const CENTER_FILTER_LABELS = {
  modality: {
    on_site: "Presencial",
    distance: "A distancia",
    mixed: "Mixta",
    unknown: "Modalidad no publicada",
  } as Record<string, string>,
  teachingType: {
    public: "Pública",
    concerted: "Concertada",
    private: "Privada",
  } as Record<string, string>,
  ownership: {
    education: "Centro educativo",
    municipality: "Centro municipal",
    agriculture: "Centro de formación agraria",
    private: "Centro privado",
  } as Record<string, string>,
  level: {
    basic: "grado básico",
    intermediate: "grado medio",
    higher: "grado superior",
    specialization: "curso de especialización",
  } as Record<string, string>,
  unpublishedModality: "Modalidad no publicada",
  unpublishedModalityFilter: "Sin modalidad publicada",
};

const spanishCollator = new Intl.Collator("es");

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Contractual unit of the centers catalog: one visible row per unique
 * `centerCode:programKey` (analysis/catalog-filter-semantics.md). Raw
 * offerings that only differ in teachingType/modality are coalesced into
 * multivalue arrays on the row; they must never appear as duplicate rows.
 */
export function buildCenterCatalogRows({
  offerings,
  centers,
  programs,
}: {
  offerings: (TrainingOffering | LegacyTrainingOffering)[];
  centers: CenterInput[];
  programs: TrainingProgram[];
}): CenterCatalogRow[] {
  const centersByCode = new Map(
    centers.map((center) => [center.centerCode, center]),
  );
  const programsByKey = new Map(
    programs.map((program) => [program.programKey, program]),
  );

  const rows = new Map<string, CenterCatalogRow>();
  for (const offering of offerings) {
    const center = centersByCode.get(offering.centerCode);
    const program = programsByKey.get(offering.programKey);
    if (center === undefined || program === undefined) continue;

    const rowKey = `${center.centerCode}:${program.programKey}`;
    let row = rows.get(rowKey);
    if (row === undefined) {
      row = {
        rowKey,
        centerCode: center.centerCode,
        centerName: center.centerName,
        centerAddress: center.address ?? null,
        centerOwnership:
          "centerOwnership" in center ? center.centerOwnership : null,
        centerWebsite: center.website ?? null,
        province: center.province,
        locality: center.locality,
        programKey: program.programKey,
        programTitle: program.programTitle,
        level: program.level,
        familyCode: program.familyCode,
        familyName: program.familyName,
        modalities: [],
        teachingTypes: [],
      };
      rows.set(rowKey, row);
    }
    const modality = String(offering.modality);
    if (modality !== "" && !row.modalities.includes(modality)) {
      row.modalities.push(modality);
    }
    if (
      "teachingType" in offering &&
      typeof offering.teachingType === "string" &&
      !row.teachingTypes.includes(offering.teachingType)
    ) {
      row.teachingTypes.push(offering.teachingType);
    }
  }

  const rowList = [...rows.values()];
  for (const row of rowList) {
    row.modalities.sort();
    row.teachingTypes.sort();
  }
  rowList.sort(
    (left, right) =>
      spanishCollator.compare(left.province, right.province) ||
      spanishCollator.compare(left.locality, right.locality) ||
      spanishCollator.compare(left.centerName, right.centerName) ||
      spanishCollator.compare(left.programTitle, right.programTitle),
  );
  return rowList;
}

function matchesFacet(
  values: string[],
  filterValue: string | undefined,
): boolean {
  if (filterValue === undefined || filterValue === "") return true;
  return values.includes(filterValue);
}

export function filterCenterRows(
  rows: CenterCatalogRow[],
  filters: CenterCatalogFilters,
): CenterCatalogRow[] {
  const query = normalizeSearchText(filters.query ?? "");
  return rows.filter((row) => {
    if (
      filters.province !== undefined &&
      filters.province !== "" &&
      row.province !== filters.province
    ) {
      return false;
    }
    if (!matchesFacet(row.modalities, filters.modalidad)) return false;
    if (!matchesFacet(row.teachingTypes, filters.titularidad)) return false;
    if (
      filters.nivel !== undefined &&
      filters.nivel !== "" &&
      row.level !== filters.nivel
    ) {
      return false;
    }
    if (
      filters.familia !== undefined &&
      filters.familia !== "" &&
      row.familyCode !== filters.familia
    ) {
      return false;
    }
    if (
      filters.ownership !== undefined &&
      filters.ownership !== "" &&
      row.centerOwnership !== filters.ownership
    ) {
      return false;
    }
    if (query !== "") {
      const haystack = normalizeSearchText(
        [
          row.centerName,
          row.locality,
          row.province,
          row.programTitle,
          row.programKey,
          row.familyName,
          row.familyCode,
        ].join(" "),
      );
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export interface CenterFacetCounts {
  rows: number;
  provinces: Record<string, number>;
  modalities: Record<string, number>;
  teachingTypes: Record<string, number>;
  levels: Record<string, number>;
  families: Record<string, number>;
  ownerships: Record<string, number>;
}

function tally(values: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const value of values) {
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

/**
 * Facet counts over unique center-program rows (never raw offerings). A
 * multivalue row counts once in EACH of its facets; Σ facet counts may exceed
 * the row count. When `filters` are provided the counts describe the universe
 * filtered by all OTHER filters (standard faceted-search behaviour).
 */
export function facetCountsFor(
  rows: CenterCatalogRow[],
  filters: CenterCatalogFilters,
): CenterFacetCounts {
  const otherThan = (key: keyof CenterCatalogFilters): CenterCatalogFilters => {
    const rest = { ...filters };
    delete rest[key];
    return rest;
  };

  const countFacet = (
    key: keyof CenterCatalogFilters,
    valueOf: (row: CenterCatalogRow) => string[],
  ): Record<string, number> => {
    const universe = filterCenterRows(rows, otherThan(key));
    return tally(universe.flatMap((row) => valueOf(row)));
  };

  const countSingle = (
    key: keyof CenterCatalogFilters,
    valueOf: (row: CenterCatalogRow) => string,
  ): Record<string, number> => countFacet(key, (row) => [valueOf(row)]);

  const universe = filterCenterRows(rows, filters);
  return {
    rows: universe.length,
    provinces: countSingle("province", (row) => row.province),
    modalities: countFacet("modalidad", (row) => [...row.modalities]),
    teachingTypes: countFacet("titularidad", (row) => [...row.teachingTypes]),
    levels: countSingle("nivel", (row) => row.level),
    families: countSingle("familia", (row) => row.familyCode),
    ownerships: countFacet("ownership", (row) =>
      row.centerOwnership === null ? [] : [row.centerOwnership],
    ),
  };
}
