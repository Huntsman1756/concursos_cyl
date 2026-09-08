import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import type { TrainingProgram } from "../../data/schemas/generated";
import { deriveBaseProgramKey } from "../analysis/buildFpCoverageResearchQueue";
import { approvedSingleTokenAuditIdentities } from "../analysis/validateFpOneWordPublicationReview";
import {
  buildOccupationIndex,
  loadApprovedMappings,
} from "../../src/domain/occupation";
import {
  buildMappingCoverage,
  loadCuratedMappingsFromDisk,
  validateCuratedMappings,
} from "./validateCuratedMappings";

const programs: TrainingProgram[] = [
  {
    programKey: "IFC03S",
    programTitle: "Desarrollo de Aplicaciones WEB",
    level: "higher",
    familyCode: "IFC",
    familyName: "Informática y Comunicaciones",
  },
  {
    programKey: "ADG01M",
    programTitle: "Gestión Administrativa",
    level: "intermediate",
    familyCode: "ADG",
    familyName: "Administración y Gestión",
  },
  {
    programKey: "COM02M",
    programTitle: "Comercialización de Productos Alimentarios",
    level: "intermediate",
    familyCode: "COM",
    familyName: "Comercio y Marketing",
  },
  {
    programKey: "COM04S",
    programTitle: "Comercio Internacional",
    level: "higher",
    familyCode: "COM",
    familyName: "Comercio y Marketing",
  },
  {
    programKey: "COM04SD",
    programTitle: "Comercio Internacional (distancia)",
    level: "higher",
    familyCode: "COM",
    familyName: "Comercio y Marketing",
  },
  {
    programKey: "ELE03S",
    programTitle: "Mantenimiento Electrónico",
    level: "higher",
    familyCode: "ELE",
    familyName: "Electricidad y Electrónica",
  },
  {
    programKey: "AGA01M",
    programTitle: "Producción Agroecológica",
    level: "intermediate",
    familyCode: "AGA",
    familyName: "Agraria",
  },
  {
    programKey: "AGA02M",
    programTitle: "Producción Agropecuaria",
    level: "intermediate",
    familyCode: "AGA",
    familyName: "Agraria",
  },
  {
    programKey: "AGA03B",
    programTitle: "Aprovechamientos Forestales",
    level: "basic",
    familyCode: "AGA",
    familyName: "Agraria",
  },
  {
    programKey: "INA01S",
    programTitle: "Vitivinicultura",
    level: "higher",
    familyCode: "INA",
    familyName: "Industrias Alimentarias",
  },
  {
    programKey: "TMV01M",
    programTitle: "Carrocería",
    level: "intermediate",
    familyCode: "TMV",
    familyName: "Transporte y Mantenimiento de Vehículos",
  },
  {
    programKey: "TMV02M",
    programTitle: "Electromecánica de Vehículos Automóviles",
    level: "intermediate",
    familyCode: "TMV",
    familyName: "Transporte y Mantenimiento de Vehículos",
  },
  {
    programKey: "IMA03M",
    programTitle: "Mantenimiento Electromecánico",
    level: "intermediate",
    familyCode: "IMA",
    familyName: "Instalación y Mantenimiento",
  },
  {
    programKey: "COM01B",
    programTitle: "Servicios Comerciales",
    level: "basic",
    familyCode: "COM",
    familyName: "Comercio y Marketing",
  },
  {
    programKey: "AGA03M",
    programTitle: "Jardinería y Floristería",
    level: "intermediate",
    familyCode: "AGA",
    familyName: "Agraria",
  },
  {
    programKey: "ADG02S",
    programTitle: "Administración y Finanzas",
    level: "higher",
    familyCode: "ADG",
    familyName: "Administración y Gestión",
  },
  {
    programKey: "ADG02SD",
    programTitle: "Administración y Finanzas (distancia)",
    level: "higher",
    familyCode: "ADG",
    familyName: "Administración y Gestión",
  },
  {
    programKey: "IFC01M",
    programTitle: "Sistemas Microinformáticos y Redes",
    level: "intermediate",
    familyCode: "IFC",
    familyName: "Informática y Comunicaciones",
  },
  {
    programKey: "IFC01MD",
    programTitle: "Sistemas Microinformáticos y Redes (distancia)",
    level: "intermediate",
    familyCode: "IFC",
    familyName: "Informática y Comunicaciones",
  },
  {
    programKey: "SSC01S",
    programTitle: "Educación Infantil",
    level: "higher",
    familyCode: "SSC",
    familyName: "Servicios Socioculturales y a la Comunidad",
  },
  {
    programKey: "SSC01SD",
    programTitle: "Educación Infantil (distancia)",
    level: "higher",
    familyCode: "SSC",
    familyName: "Servicios Socioculturales y a la Comunidad",
  },
  ...([
    [
      "ELE01M",
      "Instalaciones Eléctricas y Automáticas",
      "intermediate",
      "ELE",
      "Electricidad y Electrónica",
    ],
    [
      "ELE01MD",
      "Instalaciones Eléctricas y Automáticas (distancia)",
      "intermediate",
      "ELE",
      "Electricidad y Electrónica",
    ],
    [
      "ADG01B",
      "Servicios Administrativos",
      "basic",
      "ADG",
      "Administración y Gestión",
    ],
    [
      "ELE01B",
      "Electricidad y Electrónica",
      "basic",
      "ELE",
      "Electricidad y Electrónica",
    ],
    [
      "IFC02S",
      "Desarrollo de Aplicaciones Multiplataforma",
      "higher",
      "IFC",
      "Informática y Comunicaciones",
    ],
    [
      "IFC02SD",
      "Desarrollo de Aplicaciones Multiplataforma (distancia)",
      "higher",
      "IFC",
      "Informática y Comunicaciones",
    ],
    [
      "TMV01B",
      "Mantenimiento de Vehículos",
      "basic",
      "TMV",
      "Transporte y Mantenimiento de Vehículos",
    ],
    [
      "IFC01S",
      "Administración de Sistemas Informáticos en Red",
      "higher",
      "IFC",
      "Informática y Comunicaciones",
    ],
    [
      "IFC01SD",
      "Administración de Sistemas Informáticos en Red (distancia)",
      "higher",
      "IFC",
      "Informática y Comunicaciones",
    ],
    ["HOT01B", "Cocina y Restauración", "basic", "HOT", "Hostelería y Turismo"],
    [
      "SSC03S",
      "Integración Social",
      "higher",
      "SSC",
      "Servicios Socioculturales y a la Comunidad",
    ],
    [
      "SSC03SD",
      "Integración Social (distancia)",
      "higher",
      "SSC",
      "Servicios Socioculturales y a la Comunidad",
    ],
    [
      "ELE02M",
      "Instalaciones de Telecomunicaciones",
      "intermediate",
      "ELE",
      "Electricidad y Electrónica",
    ],
    ["IMP01B", "Peluquería y Estética", "basic", "IMP", "Imagen Personal"],
    [
      "TMV01S",
      "Automoción",
      "higher",
      "TMV",
      "Transporte y Mantenimiento de Vehículos",
    ],
    [
      "AFD01S",
      "Enseñanza y Animación Sociodeportiva",
      "higher",
      "AFD",
      "Actividades Físicas y Deportivas",
    ],
    [
      "AFD01SD",
      "Enseñanza y Animación Sociodeportiva (distancia)",
      "higher",
      "AFD",
      "Actividades Físicas y Deportivas",
    ],
    [
      "IMA03S",
      "Mecatrónica Industrial",
      "higher",
      "IMA",
      "Instalación y Mantenimiento",
    ],
    ["SAN08S", "Laboratorio Clínico y Biomédico", "higher", "SAN", "Sanidad"],
    [
      "SAN08SD",
      "Laboratorio Clínico y Biomédico (distancia)",
      "higher",
      "SAN",
      "Sanidad",
    ],
    [
      "IFC01B",
      "Informática y Comunicaciones",
      "basic",
      "IFC",
      "Informática y Comunicaciones",
    ],
    [
      "COM01M",
      "Actividades Comerciales",
      "intermediate",
      "COM",
      "Comercio y Marketing",
    ],
  ].map(([programKey, programTitle, level, familyCode, familyName]) => ({
    programKey,
    programTitle,
    level,
    familyCode,
    familyName,
  })) as TrainingProgram[]),
  {
    programKey: "IFC03SD",
    programTitle: "Desarrollo de Aplicaciones WEB (distancia)",
    level: "higher",
    familyCode: "IFC",
    familyName: "Informática y Comunicaciones",
  },
  {
    programKey: "ADG01MD",
    programTitle: "Gestión Administrativa (distancia)",
    level: "intermediate",
    familyCode: "ADG",
    familyName: "Administración y Gestión",
  },
  {
    programKey: "SAN21",
    programTitle: "Cuidados Auxiliares de Enfermería",
    level: "intermediate",
    familyCode: "SAN",
    familyName: "Sanidad",
  },
  {
    programKey: "HOT01M",
    programTitle: "Cocina y GastronomÃ­a",
    level: "intermediate",
    familyCode: "HOT",
    familyName: "HostelerÃ­a y Turismo",
  },
  {
    programKey: "SSC01M",
    programTitle: "Atención a Personas en Situación de Dependencia",
    level: "intermediate",
    familyCode: "SSC",
    familyName: "Servicios Socioculturales y a la Comunidad",
  },
  {
    programKey: "EOC01M",
    programTitle: "Construcción",
    level: "intermediate",
    familyCode: "EOC",
    familyName: "Edificación y Obra Civil",
  },
  {
    programKey: "IMP02S",
    programTitle: "Estilismo y Dirección de Peluquería",
    level: "higher",
    familyCode: "IMP",
    familyName: "Imagen Personal",
  },
  {
    programKey: "FME03S",
    programTitle: "Diseño en Fabricación Mecánica",
    level: "higher",
    familyCode: "FME",
    familyName: "Fabricación Mecánica",
  },
  {
    programKey: "HOT02S",
    programTitle: "Agencias de Viajes y Gestión de Eventos",
    level: "higher",
    familyCode: "HOT",
    familyName: "Hostelería y Turismo",
  },
  {
    programKey: "IMS03S",
    programTitle: "Producción de Audiovisuales y Espectáculos",
    level: "higher",
    familyCode: "IMS",
    familyName: "Imagen y Sonido",
  },
  {
    programKey: "SSC02S",
    programTitle: "Animación Sociocultural y Turística",
    level: "higher",
    familyCode: "SSC",
    familyName: "Servicios Socioculturales y a la Comunidad",
  },
  {
    programKey: "FME02M",
    programTitle: "Soldadura y Calderería",
    level: "intermediate",
    familyCode: "FME",
    familyName: "Fabricación Mecánica",
  },
  {
    programKey: "IMA02M",
    programTitle: "Instalaciones Frigoríficas y de Climatización",
    level: "intermediate",
    familyCode: "IMA",
    familyName: "Instalación y Mantenimiento",
  },
  {
    programKey: "FME01M",
    programTitle: "Mecanizado",
    level: "intermediate",
    familyCode: "FME",
    familyName: "Fabricación Mecánica",
  },
  {
    programKey: "FME01B",
    programTitle: "Fabricación y Montaje",
    level: "basic",
    familyCode: "FME",
    familyName: "Fabricación Mecánica",
  },
  {
    programKey: "FME01S",
    programTitle: "Programación de la Producción en Fabricación Mecánica",
    level: "higher",
    familyCode: "FME",
    familyName: "Fabricación Mecánica",
  },
  {
    programKey: "QUI02M",
    programTitle: "Operaciones de Laboratorio",
    level: "intermediate",
    familyCode: "QUI",
    familyName: "Química",
  },
  {
    programKey: "AFD02S",
    programTitle: "Acondicionamiento Físico",
    level: "higher",
    familyCode: "AFD",
    familyName: "Actividades Físicas y Deportivas",
  },
  {
    programKey: "AFD02SD",
    programTitle: "Acondicionamiento Físico (distancia)",
    level: "higher",
    familyCode: "AFD",
    familyName: "Actividades Físicas y Deportivas",
  },
  {
    programKey: "MAM01M",
    programTitle: "Carpintería y Mueble",
    level: "intermediate",
    familyCode: "MAM",
    familyName: "Madera, Mueble y Corcho",
  },
  {
    programKey: "SAN02M",
    programTitle: "Farmacia y Parafarmacia",
    level: "intermediate",
    familyCode: "SAN",
    familyName: "Sanidad",
  },
  {
    programKey: "IMP02M",
    programTitle: "Peluquería y Cosmética Capilar",
    level: "intermediate",
    familyCode: "IMP",
    familyName: "Imagen Personal",
  },
  {
    programKey: "IMP02MD",
    programTitle: "Peluquería y Cosmética Capilar (distancia)",
    level: "intermediate",
    familyCode: "IMP",
    familyName: "Imagen Personal",
  },
  {
    programKey: "ELE04S",
    programTitle: "Automatización y Robótica Industrial",
    level: "higher",
    familyCode: "ELE",
    familyName: "Electricidad y Electrónica",
  },
  ...([
    [
      "SAN07S",
      "Imagen para el Diagnóstico y Medicina Nuclear",
      "higher",
      "SAN",
      "Sanidad",
    ],
    [
      "SAN07SD",
      "Imagen para el Diagnóstico y Medicina Nuclear (distancia)",
      "higher",
      "SAN",
      "Sanidad",
    ],
    ["HOT04S", "Dirección de Cocina", "higher", "HOT", "Hostelería y Turismo"],
    [
      "ELE01S",
      "Sistemas Electrotécnicos y Automatizados",
      "higher",
      "ELE",
      "Electricidad y Electrónica",
    ],
    [
      "COM02S",
      "Transporte y Logística",
      "higher",
      "COM",
      "Comercio y Marketing",
    ],
    [
      "COM02SD",
      "Transporte y Logística (distancia)",
      "higher",
      "COM",
      "Comercio y Marketing",
    ],
    [
      "AFD02M",
      "Guía en el Medio Natural y de Tiempo Libre",
      "intermediate",
      "AFD",
      "Actividades Físicas y Deportivas",
    ],
    [
      "IFC02B",
      "Informática de Oficina",
      "basic",
      "IFC",
      "Informática y Comunicaciones",
    ],
    [
      "HOT01S",
      "Gestión de Alojamientos Turísticos",
      "higher",
      "HOT",
      "Hostelería y Turismo",
    ],
    [
      "HOT03S",
      "Guía, Información y Asistencias Turísticas",
      "higher",
      "HOT",
      "Hostelería y Turismo",
    ],
    [
      "ADG01S",
      "Asistencia a la Dirección",
      "higher",
      "ADG",
      "Administración y Gestión",
    ],
    ["IMP01M", "Estética y Belleza", "intermediate", "IMP", "Imagen Personal"],
    [
      "AGA01B",
      "Agro-jardinería y Composiciones Florales",
      "basic",
      "AGA",
      "Agraria",
    ],
    [
      "COM03S",
      "Gestión de Ventas y Espacios Comerciales",
      "higher",
      "COM",
      "Comercio y Marketing",
    ],
    [
      "ELE02S",
      "Sistemas de Telecomunicaciones e Informáticos",
      "higher",
      "ELE",
      "Electricidad y Electrónica",
    ],
    [
      "HOT02M",
      "Servicios en Restauración",
      "intermediate",
      "HOT",
      "Hostelería y Turismo",
    ],
    [
      "IMP01S",
      "Estética Integral y Bienestar",
      "higher",
      "IMP",
      "Imagen Personal",
    ],
    [
      "MAM01B",
      "Carpintería y Mueble",
      "basic",
      "MAM",
      "Madera, Mueble y Corcho",
    ],
  ].map(([programKey, programTitle, level, familyCode, familyName]) => ({
    programKey,
    programTitle,
    level,
    familyCode,
    familyName,
  })) as TrainingProgram[]),
];

// Integration checks use the catalogue addressed by the active manifest.
const diskManifest = JSON.parse(
  readFileSync(resolve(process.cwd(), "public/data/v1/manifest.json"), "utf8"),
);
const diskPrograms: TrainingProgram[] = JSON.parse(
  readFileSync(
    resolve(
      process.cwd(),
      "public",
      diskManifest.resourceSnapshots.programs.resourcePath.replace(/^\//u, ""),
    ),
    "utf8",
  ),
);

const occupations = [
  {
    occupationId: "occupation:cno11:2713",
    preferredLabel: "Analistas, programadores y diseñadores web y multimedia",
    confirmationLabel: "Programación y desarrollo web",
    classificationSystem: "CNO-11",
    classificationCode: "2713",
    reviewStatus: "approved",
    sourceUrl: "https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf",
    reviewedAt: "2026-08-04",
    catalogVersion: "1.0.0",
  },
] as const;

const aliases = [
  {
    alias: "desarrollador web",
    occupationId: "occupation:cno11:2713",
    reviewStatus: "approved",
    reviewedAt: "2026-08-04",
    mappingVersion: "1.0.0",
  },
  {
    alias: "programador web",
    occupationId: "occupation:cno11:2713",
    reviewStatus: "approved",
    reviewedAt: "2026-08-04",
    mappingVersion: "1.0.0",
  },
] as const;

const links = [
  {
    trainingProgramKey: "IFC03S",
    occupationId: "occupation:cno11:2713",
    relationshipType: "official_output",
    reviewStatus: "approved",
    sourceUrl: "https://www.boe.es/buscar/doc.php?id=BOE-A-2010-9269",
    sourceQuote: "Desarrollador de aplicaciones en entornos Web.",
    reviewedAt: "2026-08-04",
    mappingVersion: "1.0.0",
  },
] as const;

describe("curated occupation mappings", () => {
  it("rejects unknown fields and malformed stable occupation identifiers", () => {
    expect(() =>
      validateCuratedMappings({
        programs,
        occupations: [
          {
            ...occupations[0],
            occupationId: "web-development",
            hiddenScore: 0.9,
          },
        ],
        aliases,
        links,
      }),
    ).toThrow(/occupation|unrecognized|invalid/i);
  });

  it("rejects an approved relationship without a primary official citation", () => {
    expect(() =>
      validateCuratedMappings({
        programs,
        occupations,
        aliases,
        links: [
          {
            ...links[0],
            sourceUrl: "https://example.com/generated-summary",
            sourceQuote: "",
          },
        ],
      }),
    ).toThrow(/approved mapping requires.*official source.*quote/i);
  });

  it("accepts a short contiguous official BOE bullet as mapping evidence", () => {
    expect(() =>
      validateCuratedMappings({
        programs,
        occupations,
        aliases,
        links: [{ ...links[0], sourceQuote: "– Albañil." }],
      }),
    ).not.toThrow();
  });

  it.each([
    "https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf",
    "https://www.boe.es/eli/es/rd/2010/11/26/1591",
  ])(
    "rejects a classification-only source as FP relationship evidence: %s",
    (sourceUrl) => {
      expect(() =>
        validateCuratedMappings({
          programs,
          occupations,
          aliases,
          links: [{ ...links[0], sourceUrl }],
        }),
      ).toThrow(/classification alone is not relationship evidence/i);
    },
  );

  it("rejects a meaningless three-character official citation quote", () => {
    expect(() =>
      validateCuratedMappings({
        programs,
        occupations,
        aliases,
        links: [{ ...links[0], sourceQuote: "abc" }],
      }),
    ).toThrow(/at least 10 characters/i);
  });

  it("rejects an empty occupation confirmation label", () => {
    expect(() =>
      validateCuratedMappings({
        programs,
        occupations: [{ ...occupations[0], confirmationLabel: "" }],
        aliases,
        links,
      }),
    ).toThrow(/confirmation/i);
  });

  it("rejects a generic one-word alias", () => {
    expect(() =>
      validateCuratedMappings({
        programs,
        occupations,
        aliases: [{ ...aliases[0], alias: "técnico" }],
        links,
      }),
    ).toThrow(/generic/i);
  });

  it("rejects a dangling occupation relationship", () => {
    expect(() =>
      validateCuratedMappings({
        programs,
        occupations,
        aliases,
        links: [{ ...links[0], occupationId: "occupation:cno11:9999" }],
      }),
    ).toThrow(/unknown occupation/i);
  });

  it("accepts the audited accepted single-token alias only with approved_single_token", () => {
    expect(() =>
      validateCuratedMappings({
        programs,
        occupations: [
          ...occupations,
          {
            ...occupations[0],
            occupationId: "occupation:cno11:7111",
            preferredLabel:
              "Encofradores y operarios de puesta en obra de hormigÃ³n",
            confirmationLabel: "Encofrados y hormigÃ³n",
            classificationCode: "7111",
          },
        ],
        aliases: [
          {
            alias: "encofradores",
            occupationId: "occupation:cno11:7111",
            reviewStatus: "approved",
            reviewedAt: "2026-08-09",
            mappingVersion: "1.0.0",
            matchPolicy: "approved_single_token",
          },
        ],
        links: [
          ...links,
          {
            ...links[0],
            trainingProgramKey: "EOC01M",
            occupationId: "occupation:cno11:7111",
            sourceQuote: "Encofradores.",
            reviewedAt: "2026-08-09",
          },
        ],
      }),
    ).not.toThrow();
  });

  it("rejects approved_single_token when the literal form or occupation is not the audited accepted pair", () => {
    const eocOccupation = {
      ...occupations[0],
      occupationId: "occupation:cno11:7111",
      preferredLabel: "Encofradores y operarios de puesta en obra de hormigÃ³n",
      confirmationLabel: "Encofrados y hormigÃ³n",
      classificationCode: "7111",
    } as const;
    const eocLink = {
      ...links[0],
      trainingProgramKey: "EOC01M",
      occupationId: eocOccupation.occupationId,
      sourceQuote: "Encofradores.",
      reviewedAt: "2026-08-09",
    } as const;

    expect(() =>
      validateCuratedMappings({
        programs,
        occupations: [...occupations, eocOccupation],
        aliases: [
          {
            alias: "Encofradores",
            occupationId: eocOccupation.occupationId,
            reviewStatus: "approved",
            reviewedAt: "2026-08-09",
            mappingVersion: "1.0.0",
            matchPolicy: "approved_single_token",
          },
        ],
        links: [...links, eocLink],
      }),
    ).toThrow(/accepted|audit|publication/i);

    expect(() =>
      validateCuratedMappings({
        programs,
        occupations: [
          ...occupations,
          eocOccupation,
          {
            ...eocOccupation,
            occupationId: "occupation:cno11:7121",
            preferredLabel: "AlbaÃ±iles",
            confirmationLabel: "AlbaÃ±ilerÃ­a",
            classificationCode: "7121",
          },
        ],
        aliases: [
          {
            alias: "encofradores",
            occupationId: "occupation:cno11:7121",
            reviewStatus: "approved",
            reviewedAt: "2026-08-09",
            mappingVersion: "1.0.0",
            matchPolicy: "approved_single_token",
          },
        ],
        links: [
          ...links,
          eocLink,
          {
            ...eocLink,
            occupationId: "occupation:cno11:7121",
          },
        ],
      }),
    ).toThrow(/accepted|audit|publication/i);
  });

  it("rejects the audited single-token alias when its approved relationship uses a non-target program", () => {
    const eocOccupation = {
      ...occupations[0],
      occupationId: "occupation:cno11:7111",
      preferredLabel: "Encofradores y operarios de puesta en obra de hormigón",
      confirmationLabel: "Encofrados y hormigón",
      classificationCode: "7111",
    } as const;

    expect(() =>
      validateCuratedMappings({
        programs,
        occupations: [...occupations, eocOccupation],
        aliases: [
          {
            alias: "encofradores",
            occupationId: eocOccupation.occupationId,
            reviewStatus: "approved",
            reviewedAt: "2026-08-09",
            mappingVersion: "1.0.0",
            matchPolicy: "approved_single_token",
          },
        ],
        links: [
          ...links,
          {
            ...links[0],
            trainingProgramKey: "HOT01M",
            occupationId: eocOccupation.occupationId,
            sourceQuote: "Encofradores.",
            reviewedAt: "2026-08-09",
          },
        ],
      }),
    ).toThrow(/EOC01M|program|audit/i);
  });

  it("fails closed when terminal single-token audit evidence changes", () => {
    const artifact = JSON.parse(
      readFileSync(
        resolve(process.cwd(), "analysis/fp_one_word_publication_reviews.json"),
        "utf8",
      ),
    );
    const reviewedRow = artifact.rows.find(
      (row: { form: string }) => row.form === "encofradores",
    );
    if (reviewedRow === undefined) throw new Error("Missing audit row.");
    reviewedRow.requirementQuotes = ["Altered terminal evidence."];

    expect(() => approvedSingleTokenAuditIdentities(artifact)).toThrow(
      /row review|evidence drift/i,
    );
  });

  it("reads single-token audit evidence from the caller root", () => {
    const root = mkdtempSync(resolve(tmpdir(), "curated-mappings-root-"));
    try {
      const artifact = JSON.parse(
        readFileSync(
          resolve(
            process.cwd(),
            "analysis/fp_one_word_publication_reviews.json",
          ),
          "utf8",
        ),
      );
      const reviewedRow = artifact.rows.find(
        (row: { form: string }) => row.form === "encofradores",
      );
      if (reviewedRow === undefined) throw new Error("Missing audit row.");
      reviewedRow.requirementQuotes = ["Altered terminal evidence."];
      mkdirSync(resolve(root, "analysis"), { recursive: true });
      writeFileSync(
        resolve(root, "analysis/fp_one_word_publication_reviews.json"),
        `${JSON.stringify(artifact)}\n`,
        "utf8",
      );
      const pinnedOfferRelativePath =
        "public/data/v1/snapshots/20260809014318761-5b22c488ce4b/job-offers.json";
      const pinnedOfferPath = resolve(pinnedOfferRelativePath);
      const rootedPinnedOfferPath = resolve(root, pinnedOfferRelativePath);
      mkdirSync(resolve(rootedPinnedOfferPath, ".."), { recursive: true });
      writeFileSync(rootedPinnedOfferPath, readFileSync(pinnedOfferPath));

      expect(() =>
        validateCuratedMappings(
          { programs, occupations, aliases, links },
          { rootDirectory: root },
        ),
      ).toThrow(/row review|evidence drift/i);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("fails closed when a rejected audit form is changed to accepted", () => {
    const artifact = JSON.parse(
      readFileSync(
        resolve(process.cwd(), "analysis/fp_one_word_publication_reviews.json"),
        "utf8",
      ),
    );
    const rejectedRow = artifact.rows.find(
      (row: { form: string }) => row.form === "cocinero",
    );
    if (rejectedRow === undefined)
      throw new Error("Missing rejected audit row.");
    rejectedRow.disposition = "accepted";
    rejectedRow.reasonCode = "exact_occupation_title";
    rejectedRow.rationale =
      "Altered terminal audit disposition while retaining the pinned identity.";
    artifact.publicationDecision.cocinero = {
      status: "accepted",
      acceptedOfferIds: [rejectedRow.offerId],
      rejectedOfferIds: [],
      reason: "Accepted offers are eligible for publication.",
    };

    expect(() => approvedSingleTokenAuditIdentities(artifact)).toThrow(
      /row review|evidence drift/i,
    );
  });

  it("rejects unknown alias matchPolicy values", () => {
    expect(() =>
      validateCuratedMappings({
        programs,
        occupations,
        aliases: [
          {
            ...aliases[0],
            matchPolicy: "unknown_policy",
          },
        ],
        links,
      }),
    ).toThrow(/matchPolicy|invalid|unrecognized/i);
  });

  it("rejects a normalized alias assigned to different occupations", () => {
    const other = {
      ...occupations[0],
      occupationId: "occupation:cno11:4309",
      preferredLabel:
        "Empleados administrativos sin tareas de atención al público",
      confirmationLabel: "Administración de oficina",
      classificationCode: "4309",
    } as const;

    expect(() =>
      validateCuratedMappings({
        programs,
        occupations: [...occupations, other],
        aliases: [
          ...aliases,
          {
            ...aliases[0],
            alias: "Desarrolladór   web",
            occupationId: other.occupationId,
          },
        ],
        links,
      }),
    ).toThrow(/duplicate normalized alias/i);
  });

  it("builds deterministic reviewed alias search without exposing a score", () => {
    const index = buildOccupationIndex(occupations, aliases);

    expect(index.search("desarrollador web")).toEqual([
      {
        occupationId: "occupation:cno11:2713",
        preferredLabel:
          "Analistas, programadores y diseñadores web y multimedia",
        confirmationLabel: "Programación y desarrollo web",
      },
    ]);
    expect(index.search("término no revisado")).toEqual([]);
  });

  it("publishes only approved occupations, aliases, and relationships", () => {
    const approved = loadApprovedMappings({
      occupations: [
        ...occupations,
        {
          ...occupations[0],
          occupationId: "occupation:cno11:3820",
          reviewStatus: "draft",
        },
      ],
      aliases: [
        ...aliases,
        { ...aliases[0], alias: "programación", reviewStatus: "rejected" },
      ],
      links: [
        ...links,
        { ...links[0], trainingProgramKey: "ADG01M", reviewStatus: "draft" },
      ],
    });

    expect(approved.occupations).toHaveLength(1);
    expect(approved.aliases).toHaveLength(2);
    expect(approved.links).toHaveLength(1);
  });

  it("reports approved, draft, rejected, and uncovered counts by program and family", () => {
    const coverage = buildMappingCoverage(programs, [
      ...links,
      { ...links[0], trainingProgramKey: "ADG01M", reviewStatus: "draft" },
      { ...links[0], trainingProgramKey: "ADG01M", reviewStatus: "rejected" },
    ]);

    expect(coverage).toContainEqual(
      expect.objectContaining({
        scope: "program",
        programKey: "ADG02S",
        approvedMappings: 0,
        draftMappings: 0,
        rejectedMappings: 0,
        uncoveredPrograms: 1,
        coverageStatus: "uncovered",
      }),
    );
    expect(coverage).toContainEqual(
      expect.objectContaining({
        scope: "family",
        familyCode: "ADG",
        approvedMappings: 0,
        draftMappings: 1,
        rejectedMappings: 1,
        uncoveredPrograms: 5,
      }),
    );
  });

  it("keeps the unresolved Gestión Administrativa 4309/4500 choice outside approved fallback coverage", async () => {
    const curated = await loadCuratedMappingsFromDisk(
      process.cwd(),
      diskPrograms,
    );
    const approved = loadApprovedMappings(curated);
    const administrativeOccupation = curated.occupations.find(
      (occupation) => occupation.classificationCode === "4309",
    );
    const administrativeAliases = curated.aliases.filter(
      (alias) => alias.occupationId === administrativeOccupation?.occupationId,
    );
    const administrativeLinks = curated.links.filter(
      (link) =>
        ["ADG01M", "ADG01MD"].includes(link.trainingProgramKey) &&
        link.occupationId === administrativeOccupation?.occupationId,
    );

    expect(administrativeOccupation).toMatchObject({
      reviewStatus: "draft",
      reviewNote: expect.stringMatching(/4309.*4500.*unresolved/i),
    });
    expect(
      administrativeAliases.every(
        (alias) =>
          alias.reviewStatus === "draft" &&
          /4309.*4500.*unresolved/i.test(alias.reviewNote ?? ""),
      ),
    ).toBe(true);
    expect(
      administrativeLinks.every(
        (link) =>
          link.reviewStatus === "draft" &&
          /4309.*4500.*unresolved/i.test(link.reviewNote ?? ""),
      ),
    ).toBe(true);
    expect(administrativeLinks).toHaveLength(0);
    expect(
      approved.occupations.some((item) => item.classificationCode === "4309"),
    ).toBe(false);
    expect(
      approved.links
        .filter((item) =>
          ["ADG01M", "ADG01MD"].includes(item.trainingProgramKey),
        )
        .map((item) => item.occupationId),
    ).toEqual(["occupation:cno11:4113", "occupation:cno11:4113"]);
  });

  it("publishes only the evidence-backed priority FP relations", async () => {
    const curated = await loadCuratedMappingsFromDisk(
      process.cwd(),
      diskPrograms,
    );
    const approved = loadApprovedMappings(curated);
    const occupationIdsFor = (programKey: string) =>
      approved.links
        .filter((link) => link.trainingProgramKey === programKey)
        .map((link) => link.occupationId)
        .sort();

    expect(occupationIdsFor("IMP02S")).toEqual(["occupation:cno11:5811"]);
    expect(occupationIdsFor("FME03S")).toEqual(["occupation:cno11:3126"]);
    expect(occupationIdsFor("HOT02S")).toEqual(["occupation:cno11:4421"]);
    expect(occupationIdsFor("SSC02S")).toEqual([
      "occupation:cno11:3713",
      "occupation:cno11:3724",
      "occupation:cno11:4411",
    ]);
    expect(occupationIdsFor("AGA01M")).toEqual([
      "occupation:cno11:6110",
      "occupation:cno11:6120",
      "occupation:cno11:6204",
      "occupation:cno11:6205",
      "occupation:cno11:6300",
      "occupation:cno11:8321",
    ]);
    expect(occupationIdsFor("AGA02M")).toEqual([
      "occupation:cno11:6110",
      "occupation:cno11:6120",
      "occupation:cno11:6204",
      "occupation:cno11:6205",
      "occupation:cno11:6300",
      "occupation:cno11:8321",
    ]);
    expect(occupationIdsFor("AGA03B")).toEqual([
      "occupation:cno11:9511",
      "occupation:cno11:9512",
      "occupation:cno11:9530",
      "occupation:cno11:9543",
    ]);
    expect(occupationIdsFor("INA01S")).toEqual(["occupation:cno11:7709"]);
    expect(occupationIdsFor("IMS03S")).toEqual(["occupation:cno11:3532"]);

    const coverage = buildMappingCoverage(diskPrograms, curated.links);
    expect(coverage).toContainEqual(
      expect.objectContaining({
        scope: "program",
        programKey: "IMS03S",
        approvedMappings: 1,
        coverageStatus: "reviewed",
      }),
    );
  });

  it("publishes exactly the reviewed next FP coverage keys", async () => {
    const curated = await loadCuratedMappingsFromDisk(
      process.cwd(),
      diskPrograms,
    );
    const approved = loadApprovedMappings(curated);
    const expectedKeys = [
      "COM02E|1221",
      "COM02E|2651",
      "ELE02B|7510",
      "ELE02B|7533",
      "ELE02B|9700",
      "IMA01M|7250",
      "IMA01M|7221",
      "IMA01M|7222",
      "IMA01M|7294",
      "IMS01E|2921",
      "IMS01E|2923",
      "INA02M|7705",
      "INA02M|7707",
      "INA02M|8193",
      "INA02M|3510",
    ].sort();
    const actualKeys = approved.links
      .filter((link) =>
        ["COM02E", "ELE02B", "IMA01M", "IMS01E", "INA02M"].includes(
          link.trainingProgramKey,
        ),
      )
      .map(
        (link) =>
          `${link.trainingProgramKey}|${link.occupationId.replace("occupation:cno11:", "")}`,
      )
      .sort();

    expect(actualKeys).toEqual(expectedKeys);
  });

  it("defines exactly the second priority FP wave before curated publication", async () => {
    const curated = await loadCuratedMappingsFromDisk(
      process.cwd(),
      diskPrograms,
    );
    const approved = loadApprovedMappings(curated);
    const newOccupationCodes = [
      "3141",
      "3316",
      "3317",
      "5931",
      "5932",
      "5993",
      "7403",
    ];
    const relationOccupationCodes = [...newOccupationCodes, "2640"];
    const waveProgramKeys = [
      "AGA01S",
      "QUI01E",
      "SAN01S",
      "SAN01SD",
      "SAN02S",
      "SEA01M",
      "SEA01MD",
      "TMV03M",
    ];
    const expectedWaveEvidence = [
      {
        key: "AGA01S|5993",
        relationshipType: "official_output",
        sourceUrl:
          "https://www.todofp.es/que-estudiar/familias-profesionales/agraria/gestion-forestal-medio-natural.html",
        sourceQuote: "Agente forestal o similar.",
      },
      {
        key: "QUI01E|3141",
        relationshipType: "reviewed_relationship",
        sourceUrl:
          "https://www.todofp.es/que-estudiar/familias-profesionales/quimica/ce-cultivos-celulares.html",
        sourceQuote: "Experta / experto en cultivos celulares",
      },
      {
        key: "SAN01S|3317",
        relationshipType: "reviewed_relationship",
        sourceUrl:
          "https://www.todofp.es/que-estudiar/familias-profesionales/sanidad/audiologia-protesica.html",
        sourceQuote: "Audioprotésica / audioprotésico.",
      },
      {
        key: "SAN01SD|3317",
        relationshipType: "reviewed_relationship",
        sourceUrl:
          "https://www.todofp.es/que-estudiar/familias-profesionales/sanidad/audiologia-protesica.html",
        sourceQuote: "Audioprotésica / audioprotésico.",
      },
      {
        key: "SAN02S|3316",
        relationshipType: "official_output",
        sourceUrl:
          "https://www.todofp.es/que-estudiar/familias-profesionales/sanidad/protesis-dentales.html",
        sourceQuote: "Técnica / técnico especialista en prótesis dental.",
      },
      {
        key: "SAN02S|2640",
        relationshipType: "reviewed_relationship",
        sourceUrl:
          "https://www.todofp.es/que-estudiar/familias-profesionales/sanidad/protesis-dentales.html",
        sourceQuote: "Comercial en la industria dental o depósitos dentales.",
      },
      {
        key: "SEA01M|5931",
        relationshipType: "reviewed_relationship",
        sourceUrl:
          "https://www.todofp.es/que-estudiar/familias-profesionales/seguridad-medio-ambiente/emergencias-proteccion-civil.html",
        sourceQuote: "Bombera / bombero de aeropuertos.",
      },
      {
        key: "SEA01MD|5931",
        relationshipType: "reviewed_relationship",
        sourceUrl:
          "https://www.todofp.es/que-estudiar/familias-profesionales/seguridad-medio-ambiente/emergencias-proteccion-civil.html",
        sourceQuote: "Bombera / bombero de aeropuertos.",
      },
      {
        key: "SEA01M|5932",
        relationshipType: "reviewed_relationship",
        sourceUrl:
          "https://www.todofp.es/que-estudiar/familias-profesionales/seguridad-medio-ambiente/emergencias-proteccion-civil.html",
        sourceQuote: "Bombera / bombero forestal.",
      },
      {
        key: "SEA01MD|5932",
        relationshipType: "reviewed_relationship",
        sourceUrl:
          "https://www.todofp.es/que-estudiar/familias-profesionales/seguridad-medio-ambiente/emergencias-proteccion-civil.html",
        sourceQuote: "Bombera / bombero forestal.",
      },
      {
        key: "SEA01M|5993",
        relationshipType: "reviewed_relationship",
        sourceUrl:
          "https://www.todofp.es/que-estudiar/familias-profesionales/seguridad-medio-ambiente/emergencias-proteccion-civil.html",
        sourceQuote: "Vigilante de incendios forestales.",
      },
      {
        key: "SEA01MD|5993",
        relationshipType: "reviewed_relationship",
        sourceUrl:
          "https://www.todofp.es/que-estudiar/familias-profesionales/seguridad-medio-ambiente/emergencias-proteccion-civil.html",
        sourceQuote: "Vigilante de incendios forestales.",
      },
      {
        key: "TMV03M|7403",
        relationshipType: "reviewed_relationship",
        sourceUrl:
          "https://www.todofp.es/que-estudiar/familias-profesionales/transporte-mantenimiento-vehiculos/electromecanica-maquinaria.html",
        sourceQuote:
          "Electromecánica / electromecánico de maquinaria agrícola.",
      },
    ].sort((left, right) => left.key.localeCompare(right.key));

    expect
      .soft(
        newOccupationCodes.filter((code) =>
          approved.occupations.some(
            (occupation) => occupation.classificationCode === code,
          ),
        ),
      )
      .toEqual(newOccupationCodes);

    const actualWaveEvidence = approved.links
      .filter((link) => waveProgramKeys.includes(link.trainingProgramKey))
      .map((link) => ({
        key: `${link.trainingProgramKey}|${link.occupationId.replace("occupation:cno11:", "")}`,
        relationshipType: link.relationshipType,
        sourceUrl: link.sourceUrl,
        sourceQuote: link.sourceQuote,
      }))
      .sort((left, right) => left.key.localeCompare(right.key));
    expect.soft(actualWaveEvidence).toEqual(expectedWaveEvidence);

    const relationOccupationIds = relationOccupationCodes.map(
      (code) => `occupation:cno11:${code}`,
    );
    expect(
      curated.aliases.filter((alias) =>
        relationOccupationIds.includes(alias.occupationId),
      ),
    ).toEqual([]);

    const activeManifest = JSON.parse(
      readFileSync(
        resolve(process.cwd(), "public/data/v1/manifest.json"),
        "utf8",
      ),
    ) as { resourceSnapshots: { programs: { resourcePath: string } } };
    const snapshotPrograms = JSON.parse(
      readFileSync(
        resolve(
          process.cwd(),
          "public",
          ...activeManifest.resourceSnapshots.programs.resourcePath
            .split("/")
            .filter(Boolean),
        ),
        "utf8",
      ),
    ) as TrainingProgram[];
    const programsByKey = new Map(
      snapshotPrograms.map((program) => [program.programKey, program]),
    );
    const approvedProgramKeys = new Set(
      approved.links.map((link) => link.trainingProgramKey),
    );
    const approvedPrograms = [...approvedProgramKeys].map((programKey) => {
      const program = programsByKey.get(programKey);
      if (program === undefined) {
        throw new Error(`Missing snapshot program ${programKey}.`);
      }
      return program;
    });
    const reviewedBaseKeys = new Set(
      approvedPrograms.map((program) =>
        deriveBaseProgramKey(program, programsByKey),
      ),
    );

    expect.soft(approved.links).toHaveLength(320);
    expect.soft(reviewedBaseKeys.size).toBe(152);
    expect.soft(approvedProgramKeys.size).toBe(185);
  });

  it("defers the ambiguous EOC02M plasterboard output", async () => {
    const curated = await loadCuratedMappingsFromDisk(
      process.cwd(),
      diskPrograms,
    );
    const approved = loadApprovedMappings(curated);
    expect(
      approved.links.some(
        (link) =>
          link.trainingProgramKey === "EOC02M" &&
          link.occupationId === "occupation:cno11:7211",
      ),
    ).toBe(false);
  });

  it("does not publish the five remediated contest-evidence relationships", async () => {
    const curated = await loadCuratedMappingsFromDisk(
      process.cwd(),
      diskPrograms,
    );
    const approved = loadApprovedMappings(curated);
    const remediatedKeys = [
      "FME02B|7314",
      "EOC02SD|3129",
      "IMP01S|2640",
      "AGA01B|4121",
      "COM01M|5300",
      "HOT02S|3510",
    ];
    const approvedKeys = new Set(
      approved.links.map(
        (link) =>
          `${link.trainingProgramKey}|${link.occupationId.replace("occupation:cno11:", "")}`,
      ),
    );

    expect(remediatedKeys.filter((key) => approvedKeys.has(key))).toEqual([]);
    expect(approved.links).toHaveLength(320);
    expect(approvedKeys.size).toBe(320);
    expect(
      new Set(approved.links.map((link) => link.trainingProgramKey)).size,
    ).toBe(185);
  });

  it("retains the corrected official evidence quotes", async () => {
    const curated = await loadCuratedMappingsFromDisk(
      process.cwd(),
      diskPrograms,
    );
    const approved = loadApprovedMappings(curated);
    const quoteFor = (key: string) => {
      const [programKey, occupationCode] = key.split("|");
      return approved.links.find(
        (link) =>
          link.trainingProgramKey === programKey &&
          link.occupationId === `occupation:cno11:${occupationCode}`,
      )?.sourceQuote;
    };

    expect(quoteFor("ELE02B|9700")).toBe(
      "Peones de industrias manufactureras.",
    );
    expect(quoteFor("SSC01S|2252")).toBe(
      "Educador o educadora infantil en primer ciclo de educación infantil",
    );
    expect(approved.links).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          trainingProgramKey: "HOT02S",
          occupationId: "occupation:cno11:3510",
        }),
      ]),
    );
  });

  it("publishes exactly the conservative Task 4 FP-to-CNO wave", async () => {
    const curated = await loadCuratedMappingsFromDisk(
      process.cwd(),
      diskPrograms,
    );
    const approved = loadApprovedMappings(curated);
    const expected = [
      {
        key: "MAM02M|7812",
        relationshipType: "reviewed_relationship",
        sourceQuote:
          "Operador / operadora de máquinas fijas para fabricar productos de madera.",
      },
      {
        key: "SSC06S|5894",
        relationshipType: "reviewed_relationship",
        sourceQuote: "Profesor de formación vial.",
      },
      {
        key: "AGA03M|6120",
        relationshipType: "reviewed_relationship",
        sourceQuote: "Trabajador / trabajadora de huertas, viveros y jardines.",
      },
      {
        key: "INA03M|8160",
        relationshipType: "official_output",
        sourceQuote:
          "Operador / operadora de máquinas y equipos para el tratamiento y elaboración de productos alimentarios.",
      },
      {
        key: "TMV05M|7404",
        relationshipType: "reviewed_relationship",
        sourceQuote:
          "Técnica / técnico en mantenimiento de sistemas de tracción y motores.",
      },
      {
        key: "ARG01M|7621",
        relationshipType: "reviewed_relationship",
        sourceQuote: "Técnica / técnico en preimpresión.",
      },
      {
        key: "SSC04S|3714",
        relationshipType: "official_output",
        sourceQuote:
          "Promotor / promotora para la igualdad efectiva de mujeres y hombres.",
      },
      {
        key: "ELE05S|3125",
        relationshipType: "official_output",
        sourceQuote:
          "Técnica / técnico en electrónica, especialidad en electromedicina.",
      },
      {
        key: "ELE05S|7532",
        relationshipType: "official_output",
        sourceQuote:
          "Instalador-reparador / instaladora-reparadora en electromedicina.",
      },
      {
        key: "ENA02S|3131",
        relationshipType: "reviewed_relationship",
        sourceQuote:
          "Técnica / técnico de operación y mantenimiento de centrales hidroeléctricas.",
      },
      {
        key: "ENA04S|3132",
        relationshipType: "reviewed_relationship",
        sourceQuote:
          "Operador / operadora de planta de tratamiento de agua de abastecimiento.",
      },
      {
        key: "TCP02B|7835",
        relationshipType: "official_output",
        sourceQuote: "Tapicera / tapicero de muebles.",
      },
      {
        key: "QUI01M|8131",
        relationshipType: "official_output",
        sourceQuote:
          "Operador / operadora principal en instalaciones de tratamiento químico.",
      },
    ] as const;
    const waveKeys = new Set<string>(expected.map(({ key }) => key));
    const actual = approved.links
      .filter((link) =>
        waveKeys.has(
          `${link.trainingProgramKey}|${link.occupationId.replace("occupation:cno11:", "")}`,
        ),
      )
      .map((link) => ({
        key: `${link.trainingProgramKey}|${link.occupationId.replace("occupation:cno11:", "")}`,
        relationshipType: link.relationshipType,
        sourceUrl: link.sourceUrl,
        sourceQuote: link.sourceQuote,
      }))
      .sort((left, right) => left.key.localeCompare(right.key));

    expect(actual).toHaveLength(expected.length);
    expect(actual.map(({ key }) => key)).toEqual(
      expected.map(({ key }) => key).toSorted(),
    );
    for (const row of expected) {
      expect(actual).toContainEqual({
        ...row,
        sourceUrl: expect.stringMatching(
          /^https:\/\/(?:www\.)?(?:todofp|boe)\.es\//u,
        ),
      });
    }
    expect(approved.occupations).toHaveLength(158);
    expect(
      approved.occupations.filter((occupation) =>
        [
          "5894",
          "8160",
          "7404",
          "7621",
          "3714",
          "3125",
          "7532",
          "3131",
          "3132",
          "7835",
          "8131",
        ].includes(occupation.classificationCode),
      ),
    ).toHaveLength(11);
    expect(
      approved.links.some(
        (link) =>
          link.trainingProgramKey === "AGA03M" &&
          link.occupationId === "occupation:cno11:5220",
      ),
    ).toBe(false);
  });

  it("publishes exactly the reviewed Task 5 FP-to-CNO wave", async () => {
    const curated = await loadCuratedMappingsFromDisk(
      process.cwd(),
      diskPrograms,
    );
    const approved = loadApprovedMappings(curated);
    const expected = [
      {
        key: "IMS01S|2484",
        relationshipType: "reviewed_relationship",
        sourceUrl:
          "https://www.todofp.es/que-estudiar/familias-profesionales/imagen-sonido/animaciones3d-juegos-entornos-interactivos.html",
        sourceQuote: "Grafista digital.",
      },
      {
        key: "IMS01S|2713",
        relationshipType: "reviewed_relationship",
        sourceUrl:
          "https://www.todofp.es/que-estudiar/familias-profesionales/imagen-sonido/animaciones3d-juegos-entornos-interactivos.html",
        sourceQuote:
          "Desarrollador / desarrolladora de aplicaciones y productos audiovisuales multimedia.",
      },
      {
        key: "AGA02S|6120",
        relationshipType: "reviewed_relationship",
        sourceUrl:
          "https://www.todofp.es/que-estudiar/familias-profesionales/agraria/paisajismo-medio-rural.html",
        sourceQuote:
          "Encargada / encargado o capataz agrícola de huertas, viveros y jardines, en general.",
      },
      {
        key: "COM01E|2651",
        relationshipType: "reviewed_relationship",
        sourceUrl:
          "https://www.todofp.es/que-estudiar/familias-profesionales/comercio-marketing/ce-posicionamiento-buscadores-comunicacion-rrss.html",
        sourceQuote:
          "Especialistas en captación y fidelización de clientes (Inbound Marketing Specialist).",
      },
      {
        key: "ELE01E|2729",
        relationshipType: "reviewed_relationship",
        sourceUrl:
          "https://www.todofp.es/que-estudiar/familias-profesionales/electricidad-electronica/ce-ciberseguridad-tecnologias-operacion.html",
        sourceQuote: "Analista de ciberseguridad en entornos de la operación.",
      },
      {
        key: "EOC01B|7121",
        relationshipType: "reviewed_relationship",
        sourceUrl:
          "https://www.todofp.es/que-estudiar/familias-profesionales/edificacion-obra-civil/reforma-mantenimiento-edificios.html",
        sourceQuote: "Ayudante de albañil.",
      },
      {
        key: "EOC01B|7191",
        relationshipType: "reviewed_relationship",
        sourceUrl:
          "https://www.todofp.es/que-estudiar/familias-profesionales/edificacion-obra-civil/reforma-mantenimiento-edificios.html",
        sourceQuote: "Ayudante de mantenimiento básico de edificios.",
      },
      {
        key: "EOC01B|7211",
        relationshipType: "reviewed_relationship",
        sourceUrl:
          "https://www.todofp.es/que-estudiar/familias-profesionales/edificacion-obra-civil/reforma-mantenimiento-edificios.html",
        sourceQuote: "Ayudante de escayolista.",
      },
      {
        key: "EOC01B|7231",
        relationshipType: "reviewed_relationship",
        sourceUrl:
          "https://www.todofp.es/que-estudiar/familias-profesionales/edificacion-obra-civil/reforma-mantenimiento-edificios.html",
        sourceQuote: "Ayudante de pintor / pintora.",
      },
      {
        key: "EOC01B|7240",
        relationshipType: "reviewed_relationship",
        sourceUrl:
          "https://www.todofp.es/que-estudiar/familias-profesionales/edificacion-obra-civil/reforma-mantenimiento-edificios.html",
        sourceQuote: "Ayudante de solador / soladora.",
      },
      {
        key: "EOC01B|9602",
        relationshipType: "reviewed_relationship",
        sourceUrl:
          "https://www.todofp.es/que-estudiar/familias-profesionales/edificacion-obra-civil/reforma-mantenimiento-edificios.html",
        sourceQuote: "Peón especializado.",
      },
      {
        key: "EOC02M|7231",
        relationshipType: "reviewed_relationship",
        sourceUrl:
          "https://www.todofp.es/que-estudiar/familias-profesionales/edificacion-obra-civil/obras-interior-decoracion-rehabilitacion.html",
        sourceQuote: "Pintor / pintora de obra.",
      },
      {
        key: "EOC02M|7240",
        relationshipType: "reviewed_relationship",
        sourceUrl:
          "https://www.todofp.es/que-estudiar/familias-profesionales/edificacion-obra-civil/obras-interior-decoracion-rehabilitacion.html",
        sourceQuote:
          "Colocador / colocadora de pavimentos ligeros, en general.",
      },
      {
        key: "FME01E|2482",
        relationshipType: "reviewed_relationship",
        sourceUrl:
          "https://www.todofp.es/que-estudiar/familias-profesionales/fabricacion-mecanica/ce-fabricacion-aditiva.html",
        sourceQuote: "Experto en diseño de producto para impresión 3D.",
      },
      {
        key: "IMA02S|7250",
        relationshipType: "reviewed_relationship",
        sourceUrl:
          "https://www.todofp.es/que-estudiar/familias-profesionales/instalacion-mantenimiento/mnto-inst-termicas-fluidos.html",
        sourceQuote: "Frigorista.",
      },
      {
        key: "IMS04S|3831",
        relationshipType: "reviewed_relationship",
        sourceUrl:
          "https://www.todofp.es/que-estudiar/familias-profesionales/imagen-sonido/sonido-audiovisuales-espectaculos.html",
        sourceQuote: "Técnica / técnico de grabación de sonido en estudio.",
      },
    ] as const;
    const waveKeys = new Set<string>(expected.map(({ key }) => key));
    const actual = approved.links
      .filter((link) =>
        waveKeys.has(
          `${link.trainingProgramKey}|${link.occupationId.replace("occupation:cno11:", "")}`,
        ),
      )
      .map((link) => ({
        key: `${link.trainingProgramKey}|${link.occupationId.replace("occupation:cno11:", "")}`,
        relationshipType: link.relationshipType,
        sourceUrl: link.sourceUrl,
        sourceQuote: link.sourceQuote,
      }))
      .sort((left, right) => left.key.localeCompare(right.key));

    expect(actual).toEqual(
      [...expected].sort((left, right) => left.key.localeCompare(right.key)),
    );
    expect(approved.links).toHaveLength(320);
    expect(approved.occupations).toHaveLength(158);
    expect(curated.occupations).toHaveLength(163);
    expect(curated.aliases).toHaveLength(35);
    const task5FunctionalBoundaries = Object.fromEntries(
      curated.links
        .filter((link) =>
          [
            "EOC01B|7121",
            "EOC01B|7191",
            "EOC01B|7211",
            "EOC01B|7231",
            "EOC01B|7240",
            "EOC01B|9602",
          ].includes(
            `${link.trainingProgramKey}|${link.occupationId.replace("occupation:cno11:", "")}`,
          ),
        )
        .map((link) => [
          `${link.trainingProgramKey}|${link.occupationId.replace("occupation:cno11:", "")}`,
          (link as { functionalBoundary?: unknown }).functionalBoundary,
        ]),
    );
    expect(task5FunctionalBoundaries).toEqual({
      "EOC01B|7121": {
        roleLevel: "assistant",
        fullOccupationQualification: false,
      },
      "EOC01B|7191": {
        roleLevel: "assistant",
        fullOccupationQualification: false,
      },
      "EOC01B|7211": {
        roleLevel: "assistant",
        fullOccupationQualification: false,
      },
      "EOC01B|7231": {
        roleLevel: "assistant",
        fullOccupationQualification: false,
      },
      "EOC01B|7240": {
        roleLevel: "assistant",
        fullOccupationQualification: false,
      },
      "EOC01B|9602": {
        roleLevel: "adjacent",
        fullOccupationQualification: false,
      },
    });
    expect(
      curated.occupations.filter((occupation) =>
        [
          "2482",
          "2484",
          "2729",
          "3831",
          "7191",
          "7211",
          "7231",
          "9602",
        ].includes(occupation.classificationCode),
      ),
    ).toHaveLength(8);
    expect(
      ["EOC01B|7212", "EOC02M|3202", "EOC02M|7212"].some((key) =>
        approved.links.some(
          (link) =>
            `${link.trainingProgramKey}|${link.occupationId.replace("occupation:cno11:", "")}` ===
            key,
        ),
      ),
    ).toBe(false);
    expect(
      approved.links.some((link) => link.trainingProgramKey === "IMS03S"),
    ).toBe(true);
    expect(
      approved.links.some((link) => link.trainingProgramKey === "IFC03E"),
    ).toBe(true);
  });

  it("publishes only EOC01M aliases accepted by the official audit", async () => {
    const curated = await loadCuratedMappingsFromDisk(
      process.cwd(),
      diskPrograms,
    );
    const approved = loadApprovedMappings(curated);
    const eocLinks = approved.links.filter(
      (link) => link.trainingProgramKey === "EOC01M",
    );
    const eocOccupationIds = eocLinks.map((link) => link.occupationId).sort();

    expect(eocOccupationIds).toEqual([
      "occupation:cno11:7111",
      "occupation:cno11:7121",
      "occupation:cno11:7193",
      "occupation:cno11:7240",
      "occupation:cno11:7291",
    ]);
    expect(
      approved.aliases
        .filter((alias) => eocOccupationIds.includes(alias.occupationId))
        .map(({ alias, occupationId }) => ({ alias, occupationId })),
    ).toEqual([
      {
        alias: "encofradores",
        occupationId: "occupation:cno11:7111",
      },
      {
        alias: "Impermeabilizadores de terrazas",
        occupationId: "occupation:cno11:7193",
      },
      {
        alias: "Instaladores de materiales de impermeabilización en edificios",
        occupationId: "occupation:cno11:7193",
      },
      {
        alias: "Instaladores de sistemas de impermeabilización en edificios",
        occupationId: "occupation:cno11:7193",
      },
      {
        alias: "Pavimentadores a base de hormigón",
        occupationId: "occupation:cno11:7111",
      },
      {
        alias: "Pavimentadores con adoquines",
        occupationId: "occupation:cno11:7240",
      },
    ]);
  });
});
