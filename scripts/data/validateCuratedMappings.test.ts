import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import type { TrainingProgram } from "../../data/schemas/generated";
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

const diskPrograms: TrainingProgram[] = [
  ...programs,
  {
    programKey: "AGA03S",
    programTitle: "Ganadería y Asistencia en Sanidad Animal",
    level: "higher",
    familyCode: "AGA",
    familyName: "Agraria",
  },
  {
    programKey: "AGA04M",
    programTitle: "Aprovechamiento y Conservación del Medio Natural",
    level: "intermediate",
    familyCode: "AGA",
    familyName: "Agraria",
  },
  {
    programKey: "EOC02S",
    programTitle: "Proyectos de Obra Civil",
    level: "higher",
    familyCode: "EOC",
    familyName: "Edificación y Obra Civil",
  },
  {
    programKey: "EOC02SD",
    programTitle: "Proyectos de Obra Civil (distancia)",
    level: "higher",
    familyCode: "EOC",
    familyName: "Edificación y Obra Civil",
  },
  {
    programKey: "FME02S",
    programTitle: "Construcciones Metálicas",
    level: "higher",
    familyCode: "FME",
    familyName: "Fabricación Mecánica",
  },
  {
    programKey: "SAN04S",
    programTitle: "Anatomía Patológica y Citodiagnóstico",
    level: "higher",
    familyCode: "SAN",
    familyName: "Sanidad",
  },
  {
    programKey: "SEA03S",
    programTitle: "Química y Salud Ambiental",
    level: "higher",
    familyCode: "SEA",
    familyName: "Seguridad y Medio Ambiente",
  },
  {
    programKey: "SSC05S",
    programTitle: "Mediación Comunicativa",
    level: "higher",
    familyCode: "SSC",
    familyName: "Servicios Socioculturales y a la Comunidad",
  },
  {
    programKey: "TMV03E",
    programTitle:
      "Mantenimiento y seguridad en sistemas de vehículos hibridos y eléctricos",
    level: "specialization",
    familyCode: "TMV",
    familyName: "Transporte y Mantenimiento de Vehículos",
  },
  {
    programKey: "ENA03S",
    programTitle: "Energías Renovables",
    level: "higher",
    familyCode: "ENA",
    familyName: "Energía y Agua",
  },
  {
    programKey: "FME02B",
    programTitle: "Fabricación de Elementos Metálicos",
    level: "basic",
    familyCode: "FME",
    familyName: "Fabricación Mecánica",
  },
  {
    programKey: "HOT05S",
    programTitle: "Dirección de Servicios de Restauración",
    level: "higher",
    familyCode: "HOT",
    familyName: "Hostelería y Turismo",
  },
  {
    programKey: "INA02S",
    programTitle: "Procesos y Calidad en la Industria Alimentaria",
    level: "higher",
    familyCode: "INA",
    familyName: "Industrias Alimentarias",
  },
  {
    programKey: "QUI01S",
    programTitle: "Laboratorio de Análisis y Control de Calidad",
    level: "higher",
    familyCode: "QUI",
    familyName: "Química",
  },
  {
    programKey: "SAN09S",
    programTitle: "Radioterapia y Dosimetría",
    level: "higher",
    familyCode: "SAN",
    familyName: "Sanidad",
  },
  {
    programKey: "SAN09SD",
    programTitle: "Radioterapia y Dosimetría (distancia)",
    level: "higher",
    familyCode: "SAN",
    familyName: "Sanidad",
  },
];

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
    expect(approved.occupations.map((item) => item.classificationCode)).toEqual(
      [
        "2312",
        "2713",
        "4424",
        "4121",
        "5110",
        "5120",
        "5611",
        "5612",
        "5629",
        "5710",
        "9310",
        "7111",
        "7121",
        "7193",
        "7240",
        "7291",
        "3510",
        "3522",
        "3523",
        "5210",
        "5220",
        "5420",
        "5500",
        "6120",
        "7132",
        "7250",
        "7312",
        "7313",
        "7314",
        "7531",
        "6110",
        "6204",
        "6205",
        "8321",
        "7232",
        "5492",
        "4123",
        "9820",
        "8333",
        "7322",
        "7323",
        "7324",
        "7812",
        "8209",
        "5621",
        "5811",
        "5812",
        "2252",
        "3811",
        "3812",
        "3813",
        "4111",
        "4113",
        "4223",
        "2721",
        "2722",
        "3814",
        "7294",
        "7510",
        "7533",
        "4210",
        "4221",
        "4301",
        "4411",
        "4423",
        "9431",
        "8202",
        "3820",
        "7293",
        "7401",
        "3713",
        "1432",
        "2640",
        "3126",
        "3160",
        "3314",
        "3405",
        "3722",
        "3723",
        "3724",
        "4412",
        "5300",
        "5992",
        "7221",
        "9700",
        "3123",
        "3124",
        "3129",
        "3139",
        "3209",
        "7521",
      ],
    );
    expect(
      approved.links.reduce<Record<string, number>>((counts, item) => {
        counts[item.trainingProgramKey] =
          (counts[item.trainingProgramKey] ?? 0) + 1;
        return counts;
      }, {}),
    ).toEqual(
      Object.fromEntries(
        Object.entries({
          IFC03S: 1,
          IFC03SD: 1,
          SSC01M: 2,
          SAN21: 2,
          HOT01M: 1,
          COM02M: 2,
          EOC01M: 5,
          AGA03M: 2,
          FME02M: 4,
          FME02S: 1,
          IMA02M: 1,
          ELE03S: 1,
          ELE04S: 6,
          AGA01M: 5,
          TMV01M: 1,
          COM01B: 7,
          FME01M: 3,
          MAM01M: 2,
          SAN02M: 1,
          SAN04S: 1,
          IMP02M: 2,
          IMP02S: 1,
          ADG02S: 4,
          ADG02SD: 4,
          IFC01M: 3,
          IFC01MD: 1,
          SSC01S: 1,
          SSC01SD: 1,
          IFC01S: 5,
          IFC01SD: 5,
          ELE01M: 1,
          ELE01MD: 3,
          ADG01B: 8,
          ELE01B: 3,
          IFC02S: 2,
          IFC02SD: 2,
          TMV01B: 3,
          HOT01B: 2,
          SSC03S: 2,
          SSC03SD: 2,
          ELE02M: 2,
          SEA03S: 2,
          SSC05S: 1,
          IMP01B: 2,
          TMV01S: 3,
          IMA03S: 1,
          IFC01B: 2,
          COM01M: 9,
          AFD01S: 4,
          AFD01SD: 4,
          SAN08S: 1,
          SAN08SD: 1,
          ADG01M: 1,
          ADG01MD: 1,
          TMV02M: 1,
          IMA03M: 1,
          TMV03E: 1,
          QUI02M: 1,
          COM04S: 3,
          COM04SD: 3,
          FME01B: 2,
          FME01S: 1,
          AFD02S: 1,
          AFD02SD: 1,
          SAN07S: 1,
          SAN07SD: 1,
          HOT04S: 1,
          ELE01S: 2,
          COM02S: 4,
          COM02SD: 4,
          AFD02M: 2,
          IFC02B: 1,
          HOT01S: 1,
          ADG01S: 1,
          IMP01M: 5,
          HOT03S: 2,
          AGA01B: 2,
          COM03S: 2,
          ELE02S: 4,
          HOT02M: 2,
          IMP01S: 2,
          MAM01B: 3,
          AGA03S: 1,
          AGA04M: 2,
          EOC02S: 1,
          EOC02SD: 1,
          ENA03S: 2,
          FME02B: 1,
          HOT05S: 1,
          INA02S: 3,
          QUI01S: 2,
          SAN09S: 1,
          SAN09SD: 1,
        }).filter(([programKey]) =>
          approved.links.some((link) => link.trainingProgramKey === programKey),
        ),
      ),
    );

    const coverage = buildMappingCoverage(programs, curated.links);
    expect(coverage).toContainEqual(
      expect.objectContaining({
        scope: "program",
        programKey: "ADG01M",
        approvedMappings: 0,
        draftMappings: 0,
        coverageStatus: "uncovered",
      }),
    );
    expect(coverage).toContainEqual(
      expect.objectContaining({
        scope: "program",
        programKey: "ADG01MD",
        approvedMappings: 0,
        draftMappings: 0,
        coverageStatus: "uncovered",
      }),
    );
    expect(coverage).toContainEqual(
      expect.objectContaining({
        scope: "program",
        programKey: "HOT01M",
        approvedMappings: 1,
        coverageStatus: "reviewed",
      }),
    );
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
