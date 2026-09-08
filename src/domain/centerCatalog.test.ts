import { describe, expect, it } from "vitest";
import type {
  EducationCenter,
  TrainingOffering,
  TrainingProgram,
} from "../../data/schemas/generated";
import {
  buildCenterCatalogRows,
  filterCenterRows,
  facetCountsFor,
  CENTER_FILTER_LABELS,
} from "./centerCatalog";

function offering(partial: Partial<TrainingOffering>): TrainingOffering {
  const base: TrainingOffering = {
    centerCode: "47011115",
    centerName: "RÍO DUERO",
    centerOwnership: "private",
    familyCode: "AFD",
    familyName: "Actividades Físicas y Deportivas",
    level: "intermediate",
    locality: "Valladolid",
    modality: "on_site",
    offeringId: "",
    programKey: "AFD02M",
    programTitle: "Guía en el medio natural y de tiempo libre",
    province: "Valladolid",
    teachingType: "concerted",
  };
  const merged = { ...base, ...partial };
  merged.offeringId =
    merged.offeringId === ""
      ? `${merged.programKey}:${merged.centerCode}:${merged.modality}:${merged.teachingType}:${merged.centerOwnership}`
      : merged.offeringId;
  return merged;
}

function center(partial: Partial<EducationCenter>): EducationCenter {
  return {
    centerCode: "47011115",
    centerName: "RÍO DUERO",
    centerOwnership: "private",
    address: "C/ Ejemplo",
    email: "a@b.es",
    locality: "Valladolid",
    phone: "900",
    province: "Valladolid",
    website: "https://example.es",
    ...partial,
  };
}

function program(partial: Partial<TrainingProgram>): TrainingProgram {
  return {
    programKey: "AFD02M",
    programTitle: "Guía en el medio natural y de tiempo libre",
    level: "intermediate",
    familyCode: "AFD",
    familyName: "Actividades Físicas y Deportivas",
    ...partial,
  };
}

const rioDueroConcerted = offering({
  teachingType: "concerted",
  offeringId: "AFD02M:47011115:on_site:concerted:private",
});
const rioDueroPrivate = offering({
  teachingType: "private",
  offeringId: "AFD02M:47011115:on_site:private:private",
});
const sanGabriel = offering({
  centerCode: "09012072",
  centerName: "CIFP SAN GABRIEL",
  locality: "La Aguilera",
  province: "Burgos",
  programKey: "INA02M",
  programTitle: "Aceites de Oliva y Vinos",
  familyCode: "INA",
  familyName: "Industrias Alimentarias",
  teachingType: "public",
  offeringId: "INA02M:09012072:on_site:public:private",
});

const catalog = {
  offerings: [rioDueroConcerted, rioDueroPrivate, sanGabriel],
  centers: [
    center({}),
    center({
      centerCode: "09012072",
      centerName: "CIFP SAN GABRIEL",
      locality: "La Aguilera",
      province: "Burgos",
      centerOwnership: "private" as const,
    }),
  ],
  programs: [
    program({}),
    program({
      programKey: "INA02M",
      programTitle: "Aceites de Oliva y Vinos",
      familyCode: "INA",
      familyName: "Industrias Alimentarias",
    }),
  ],
};

describe("center catalog aggregation (centerCode:programKey)", () => {
  it("aggregates 3 raw offerings into 2 unique rows", () => {
    const rows = buildCenterCatalogRows(catalog);
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.rowKey)).toEqual([
      "09012072:INA02M",
      "47011115:AFD02M",
    ]);
  });

  it("merges teachingTypes and modalities for the multivalue row", () => {
    const rows = buildCenterCatalogRows(catalog);
    const rioDuero = rows.find((row) => row.centerCode === "47011115");
    expect(rioDuero?.teachingTypes).toEqual(["concerted", "private"]);
    expect(rioDuero?.modalities).toEqual(["on_site"]);
  });

  it("skips offerings whose center or program cannot be resolved", () => {
    const rows = buildCenterCatalogRows({
      offerings: [
        ...catalog.offerings,
        offering({
          centerCode: "99999999",
          offeringId: "AFD02M:99999999:on_site:public:education",
        }),
      ],
      centers: catalog.centers,
      programs: [...catalog.programs, program({ programKey: "NOPE01M" })],
    });
    expect(rows).toHaveLength(2);
  });

  it("carries center attributes and program attributes on each row", () => {
    const rows = buildCenterCatalogRows(catalog);
    const rioDuero = rows.find((row) => row.centerCode === "47011115");
    expect(rioDuero?.centerOwnership).toBe("private");
    expect(rioDuero?.province).toBe("Valladolid");
    expect(rioDuero?.level).toBe("intermediate");
    expect(rioDuero?.familyCode).toBe("AFD");
  });
});

describe("center catalog filters (subset of aggregated universe)", () => {
  const rows = buildCenterCatalogRows(catalog);

  it("filters by province with exact match", () => {
    const filtered = filterCenterRows(rows, { province: "Burgos" });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.centerCode).toBe("09012072");
  });

  it("matches titularidad against the aggregated teachingTypes (multivalue)", () => {
    // RÍO DUERO carries teachingTypes [concerted, private]: one row matching
    // BOTH facets, never duplicated.
    expect(filterCenterRows(rows, { titularidad: "concerted" })).toHaveLength(
      1,
    );
    expect(filterCenterRows(rows, { titularidad: "private" })).toHaveLength(1);
    expect(filterCenterRows(rows, { titularidad: "public" })).toHaveLength(1);
    const filtered = filterCenterRows(rows, { titularidad: "private" });
    expect(filtered[0]?.rowKey).toBe("47011115:AFD02M");
  });

  it("matches modalidad against the aggregated modalities", () => {
    expect(filterCenterRows(rows, { modalidad: "on_site" })).toHaveLength(2);
    expect(filterCenterRows(rows, { modalidad: "distance" })).toHaveLength(0);
  });

  it("filters by nivel, familia and tipo de centro", () => {
    expect(filterCenterRows(rows, { nivel: "intermediate" })).toHaveLength(2);
    expect(filterCenterRows(rows, { nivel: "higher" })).toHaveLength(0);
    expect(filterCenterRows(rows, { familia: "INA" })).toHaveLength(1);
    expect(filterCenterRows(rows, { ownership: "education" })).toHaveLength(0);
    expect(filterCenterRows(rows, { ownership: "private" })).toHaveLength(2);
  });

  it("searches as a normalized substring over approved fields", () => {
    expect(filterCenterRows(rows, { query: "rio duero" })).toHaveLength(1);
    expect(filterCenterRows(rows, { query: "RÍO" })).toHaveLength(1);
    expect(filterCenterRows(rows, { query: "aceites de oliva" })).toHaveLength(
      1,
    );
    expect(filterCenterRows(rows, { query: "san gabriel" })).toHaveLength(1);
    expect(filterCenterRows(rows, { query: "ina02m" })).toHaveLength(1);
    expect(filterCenterRows(rows, { query: "no existe" })).toHaveLength(0);
  });

  it("composes filters and always returns a subset of the universe", () => {
    const filtered = filterCenterRows(rows, {
      province: "Valladolid",
      titularidad: "private",
      query: "guía",
    });
    expect(filtered).toHaveLength(1);
    for (const row of filtered) {
      expect(rows).toContain(row);
    }
  });
});

describe("center catalog facet counts", () => {
  const rows = buildCenterCatalogRows(catalog);

  it("counts unique rows per facet, counting multivalue rows in each facet", () => {
    const counts = facetCountsFor(rows, {});
    expect(counts.teachingTypes.concerted).toBe(1);
    expect(counts.teachingTypes.private).toBe(1);
    expect(counts.teachingTypes.public).toBe(1);
    // Σ facet counts (3) > row count (2) is expected with multivalue rows
    expect(
      Object.values(counts.teachingTypes).reduce((a, b) => a + b, 0),
    ).toBeGreaterThan(rows.length - 1);
  });

  it("counts facets over the universe filtered by the other facets", () => {
    const filtered = filterCenterRows(rows, { province: "Burgos" });
    const counts = facetCountsFor(rows, { province: "Burgos" });
    expect(filtered).toHaveLength(1);
    expect(counts.rows).toBe(1);
    expect(counts.teachingTypes.concerted ?? 0).toBe(0);
    expect(counts.teachingTypes.private ?? 0).toBe(0);
    expect(counts.teachingTypes.public).toBe(1);
  });

  it("exposes stable Spanish labels for filter options", () => {
    expect(CENTER_FILTER_LABELS.modality.on_site).toBe("Presencial");
    expect(CENTER_FILTER_LABELS.modality.distance).toBe("A distancia");
    expect(CENTER_FILTER_LABELS.teachingType.public).toBe("Pública");
    expect(CENTER_FILTER_LABELS.teachingType.concerted).toBe("Concertada");
    expect(CENTER_FILTER_LABELS.teachingType.private).toBe("Privada");
    expect(CENTER_FILTER_LABELS.ownership.education).toBe("Centro educativo");
    expect(CENTER_FILTER_LABELS.ownership.municipality).toBe(
      "Centro municipal",
    );
    expect(CENTER_FILTER_LABELS.ownership.agriculture).toBe(
      "Centro de formación agraria",
    );
    expect(CENTER_FILTER_LABELS.ownership.private).toBe("Centro privado");
    expect(CENTER_FILTER_LABELS.level.basic).toBe("grado básico");
    expect(CENTER_FILTER_LABELS.level.intermediate).toBe("grado medio");
    expect(CENTER_FILTER_LABELS.level.higher).toBe("grado superior");
    expect(CENTER_FILTER_LABELS.level.specialization).toBe(
      "curso de especialización",
    );
    expect(CENTER_FILTER_LABELS.unpublishedModality).toBe(
      "Modalidad no publicada",
    );
    expect(CENTER_FILTER_LABELS.unpublishedModalityFilter).toBe(
      "Sin modalidad publicada",
    );
  });
});
