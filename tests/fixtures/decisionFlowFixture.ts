import type { Page } from "@playwright/test";
import { publishedRequirementId } from "../../src/domain/requirements";

const snapshotId = "e2e-decision-flow";
const snapshotPath = (fileName: string) =>
  `/data/v1/snapshots/${snapshotId}/${fileName}`;

const snapshot = {
  sourceId: "e2e-fixture",
  sourceUrl: "https://datos.example.test/source",
  sourceUpdatedAt: "2026-08-03T00:00:00.000Z",
  snapshotFetchedAt: "2026-08-05T07:52:50.485Z",
  schemaVersion: "1.0.0",
  recordCount: 2,
  sha256: "a".repeat(64),
  qualityStatus: "passed",
} as const;

const program = {
  programKey: "IFC03S",
  programTitle: "Desarrollo de Aplicaciones Web",
  level: "higher",
  familyCode: "IFC",
  familyName: "Informática y Comunicaciones",
} as const;

const distanceProgram = {
  ...program,
  programKey: "IFC03SD",
  programTitle: "Desarrollo de Aplicaciones Web (a distancia)",
} as const;

const occupation = {
  occupationId: "occupation:cno11:2713",
  preferredLabel: "Analistas, programadores y diseñadores web y multimedia",
  confirmationLabel: "Programación y desarrollo web",
  classificationSystem: "CNO-11",
  classificationCode: "2713",
  reviewStatus: "approved",
  sourceUrl: "https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf",
  reviewedAt: "2026-08-04",
  catalogVersion: "1.0.0",
} as const;

const links = [
  {
    trainingProgramKey: program.programKey,
    occupationId: occupation.occupationId,
    relationshipType: "official_output",
    reviewStatus: "approved",
    sourceUrl: "https://www.boe.es/buscar/doc.php?id=BOE-A-2010-9269&lang=es",
    sourceQuote: "Desarrollador de aplicaciones en entornos Web.",
    reviewedAt: "2026-08-04",
    mappingVersion: "1.0.0",
  },
  {
    trainingProgramKey: distanceProgram.programKey,
    occupationId: occupation.occupationId,
    relationshipType: "official_output",
    reviewStatus: "approved",
    sourceUrl: "https://www.boe.es/buscar/doc.php?id=BOE-A-2010-9269&lang=es",
    sourceQuote: "Desarrollador de aplicaciones en entornos Web.",
    reviewedAt: "2026-08-04",
    mappingVersion: "1.0.0",
  },
] as const;

const center = {
  centerCode: "47004937",
  centerName: "IES E2E Valladolid",
  centerOwnership: "education",
  province: "Valladolid",
  locality: "Valladolid",
  address: "Calle de la Evidencia, 1",
  phone: "983 000 000",
  email: "e2e@example.test",
  website: "https://centro.example.test/",
} as const;

const offerings = [
  {
    ...program,
    centerCode: center.centerCode,
    centerName: center.centerName,
    centerOwnership: center.centerOwnership,
    province: center.province,
    locality: center.locality,
    modality: "on_site",
    offeringId: "IFC03S:47004937:on_site:public:education",
    teachingType: "public",
  },
  {
    ...distanceProgram,
    centerCode: center.centerCode,
    centerName: center.centerName,
    centerOwnership: center.centerOwnership,
    province: center.province,
    locality: center.locality,
    modality: "distance",
    offeringId: "IFC03SD:47004937:distance:public:education",
    teachingType: "public",
  },
] as const;

const experienceQuote = "Experiencia mínima de un año.";
const certificateQuote = "Carné de manipulador de alimentos.";
const offerId = "offer:e2e-web";

export const syntheticRequirementId = publishedRequirementId(
  offerId,
  "experience",
  experienceQuote,
);

export const syntheticRequirementValues = ["12", "food_handler"] as const;

const requirements = [
  {
    id: syntheticRequirementId,
    category: "experience",
    normalizedValue: 12,
    sourceQuote: experienceQuote,
    parserRule: "experience.years",
    parserVersion: "1.0.0",
  },
  {
    id: publishedRequirementId(
      offerId,
      "certificate_or_regulated_license",
      certificateQuote,
    ),
    category: "certificate_or_regulated_license",
    normalizedValue: "food_handler",
    sourceQuote: certificateQuote,
    parserRule: "certificate.food_handler",
    parserVersion: "1.0.0",
  },
] as const;

const descriptionSections = {
  summary: [],
  functions: [],
  requirements: [experienceQuote, certificateQuote],
  conditions: [],
  application: [],
  other: [],
} as const;

const offers = [
  {
    id: offerId,
    title: "Desarrollador web para servicios públicos",
    province: "Valladolid",
    locality: "Valladolid",
    publishedAt: "2026-08-03T00:00:00.000Z",
    sourceName: "ECYL",
    descriptionText: `${experienceQuote} ${certificateQuote}`,
    descriptionSections,
    originalUrl: "https://empleo.example.test/oferta/e2e-web",
    sourceSnapshot: snapshot,
  },
  {
    id: "offer:e2e-web-without-experience",
    title: "Desarrollador web junior",
    province: "Burgos",
    locality: "Burgos",
    publishedAt: "2026-08-02T00:00:00.000Z",
    sourceName: "ECYL",
    descriptionText: "Oferta publicada sin experiencia estructurada.",
    descriptionSections: {
      ...descriptionSections,
      requirements: [],
    },
    originalUrl: "https://empleo.example.test/oferta/e2e-web-junior",
    sourceSnapshot: snapshot,
  },
] as const;

const manifest = {
  schemaVersion: "1.0.0",
  generatedAt: snapshot.snapshotFetchedAt,
  qualityStatus: "passed",
  resourceSnapshots: {
    programs: { ...snapshot, resourcePath: snapshotPath("programs.json") },
    centers: { ...snapshot, resourcePath: snapshotPath("centers.json") },
    trainingOfferings: {
      ...snapshot,
      resourcePath: snapshotPath("training-offerings.json"),
    },
    jobOffers: { ...snapshot, resourcePath: snapshotPath("job-offers.json") },
    occupations: {
      ...snapshot,
      resourcePath: snapshotPath("occupations.json"),
    },
    occupationAliases: {
      ...snapshot,
      resourcePath: snapshotPath("occupation-aliases.json"),
    },
    trainingOccupationLinks: {
      ...snapshot,
      resourcePath: snapshotPath("training-occupation-links.json"),
    },
    publishedRequirements: {
      ...snapshot,
      resourcePath: snapshotPath("published-requirements.json"),
    },
  },
  qualityReport: {
    counts: { programs: 2, centers: 1, offerings: 2, offers: 2 },
    nullRates: {
      centerAddress: 0,
      centerPhone: 0,
      centerEmail: 0,
      centerWebsite: 0,
      offerProvince: 0,
      offerLocality: 0,
      offerDescription: 0,
    },
    reconciliationAnomalies: [],
  },
} as const;

const resources = new Map<string, unknown>([
  ["/data/v1/manifest.json", manifest],
  [
    manifest.resourceSnapshots.programs.resourcePath,
    [program, distanceProgram],
  ],
  [manifest.resourceSnapshots.centers.resourcePath, [center]],
  [manifest.resourceSnapshots.trainingOfferings.resourcePath, offerings],
  [manifest.resourceSnapshots.jobOffers.resourcePath, offers],
  [manifest.resourceSnapshots.occupations.resourcePath, [occupation]],
  [
    manifest.resourceSnapshots.occupationAliases.resourcePath,
    [
      {
        alias: "desarrollador web",
        occupationId: occupation.occupationId,
        reviewStatus: "approved",
        reviewedAt: "2026-08-04",
        mappingVersion: "1.0.0",
      },
    ],
  ],
  [manifest.resourceSnapshots.trainingOccupationLinks.resourcePath, links],
  [
    manifest.resourceSnapshots.publishedRequirements.resourcePath,
    [{ offerId, requirements }],
  ],
]);

/** Installs test-only generated data for the full, private decision-card path. */
export async function installDecisionFlowFixture(page: Page): Promise<void> {
  await page.route("**/data/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const payload = resources.get(path);
    if (payload === undefined) {
      await route.fulfill({ status: 404 });
      return;
    }
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(payload),
    });
  });
}

export const syntheticQuotes = { certificateQuote, experienceQuote } as const;
