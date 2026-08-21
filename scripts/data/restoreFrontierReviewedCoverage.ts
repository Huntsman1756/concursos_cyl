import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  TrainingOccupationLinksSchema,
  type TrainingOccupationLink,
} from "../../data/schemas/curatedMappings";

const REVIEWED_SOURCE_COMMIT = "c3344cc6718a835f061190c20a9c38ee63834d1b";
const LINKS_PATH = "data/curated/training-occupation-links.json";

export const ACCEPTED_RELATION_KEYS = [
  "ADG01B|4411",
  "ADG01M|4113",
  "ADG01MD|4113",
  "ADG01S|4223",
  "ADG02S|4111",
  "ADG02S|4113",
  "ADG02S|4123",
  "ADG02S|4223",
  "ADG02SD|4111",
  "ADG02SD|4113",
  "ADG02SD|4123",
  "ADG02SD|4223",
  "AFD02M|3723",
  "AFD02M|3724",
  "AFD01S|3722",
  "AFD01S|3723",
  "AFD01S|3724",
  "AFD01S|5992",
  "AFD01SD|3722",
  "AFD01SD|3723",
  "AFD01SD|3724",
  "AFD01SD|5992",
  "AGA01B|4121",
  "AGA01B|5220",
  "AGA03S|2640",
  "AGA04M|6120",
  "AGA04M|8321",
  "COM01M|1432",
  "COM01M|3510",
  "COM01M|4424",
  "COM01M|5300",
  "COM01M|5420",
  "COM01M|5492",
  "COM01M|5500",
  "COM01M|9820",
  "COM02S|3510",
  "COM02S|3523",
  "COM02S|4123",
  "COM02S|5210",
  "COM02SD|3510",
  "COM02SD|3523",
  "COM02SD|4123",
  "COM02SD|5210",
  "COM03S|3510",
  "COM03S|5210",
  "ELE01B|7510",
  "ELE01S|3123",
  "ELE01S|7510",
  "ELE02M|7533",
  "ELE02S|3124",
  "ELE02S|3811",
  "ELE02S|3813",
  "ELE02S|7533",
  "ENA03S|3123",
  "ENA03S|7294",
  "EOC02S|3129",
  "EOC02SD|3129",
  "FME01S|3126",
  "FME02B|7132",
  "FME02B|7312",
  "FME02B|7314",
  "FME02B|8202",
  "FME02B|9700",
  "FME02S|7314",
  "HOT01B|9310",
  "HOT01S|3510",
  "HOT02M|4121",
  "HOT02M|5120",
  "HOT03S|4123",
  "HOT03S|4411",
  "HOT05S|3522",
  "IFC01B|7533",
  "IFC01B|8202",
  "IFC02B|7533",
  "IFC01S|2721",
  "IFC01S|2722",
  "IFC01S|3812",
  "IFC01S|3813",
  "IFC01S|3814",
  "IFC01SD|2721",
  "IFC01SD|2722",
  "IFC01SD|3812",
  "IFC01SD|3813",
  "IFC01SD|3814",
  "IFC02S|2713",
  "IFC02S|3820",
  "IFC02SD|2713",
  "IFC02SD|3820",
  "IMA03M|8202",
  "IMA03S|3126",
  "IMP01B|5811",
  "IMP01B|5812",
  "IMP02M|5811",
  "IMP02M|5812",
  "IMP02MD|5811",
  "IMP02MD|5812",
  "IMP01M|3510",
  "IMP01M|4412",
  "IMP01M|5220",
  "IMP01M|5492",
  "IMP01M|5812",
  "IMP01S|2640",
  "IMP01S|5812",
  "INA02S|3160",
  "INA02S|3209",
  "INA02S|3510",
  "MAM01B|7812",
  "MAM01B|8209",
  "MAM01B|9700",
  "QUI01S|3129",
  "QUI01S|3160",
  "QUI02M|3160",
  "SAN04S|3314",
  "SAN07S|2640",
  "SAN07SD|2640",
  "SAN09S|2640",
  "SAN09SD|2640",
  "SEA03S|2640",
  "SEA03S|3129",
  "SSC01S|2252",
  "SSC01SD|2252",
  "SSC03S|2312",
  "SSC03S|3713",
  "SSC03SD|2312",
  "SSC03SD|3713",
  "SSC05S|3713",
  "TMV01B|7401",
  "TMV01S|3160",
  "TMV01S|3405",
  "TMV01S|4412",
  "TMV02M|7401",
  "TMV03E|3405",
] as const;

const TODO_FP_ASIR_URL =
  "https://www.todofp.es/que-estudiar/familias-profesionales/informatica-comunicaciones/admin-sist-informaticos-red.html";
const TODO_FP_INTEGRATION_URL =
  "https://www.todofp.es/que-estudiar/familias-profesionales/servicios-socioculturales-comunidad/integracion-social.html";
const TODO_FP_SOCIOCULTURAL_ANIMATION_URL =
  "https://www.todofp.es/que-estudiar/familias-profesionales/actividades-fisicas-deportivas/ensenanza-animacion-sociodeportiva.html";
const BOE_SOCIOCULTURAL_ANIMATION_URL =
  "https://www.boe.es/eli/es/rd/2017/06/23/653";

const CURRENT_SOURCE_OVERRIDES: Readonly<
  Record<string, Pick<TrainingOccupationLink, "sourceUrl" | "sourceQuote">>
> = {
  "AFD01S|3722": {
    sourceUrl: TODO_FP_SOCIOCULTURAL_ANIMATION_URL,
    sourceQuote:
      "Cronometrador / cronometradora, juez / jueza y árbitra / árbitro de competiciones deportivas no oficiales.",
  },
  "AFD01S|3723": {
    sourceUrl: BOE_SOCIOCULTURAL_ANIMATION_URL,
    sourceQuote: "Profesor/a de actividades físico-deportivas.",
  },
  "AFD01S|3724": {
    sourceUrl: TODO_FP_SOCIOCULTURAL_ANIMATION_URL,
    sourceQuote:
      "Animador / animadora de veladas, espectáculos y actividades recreativas en instalaciones turísticas.",
  },
  "AFD01S|5992": {
    sourceUrl: BOE_SOCIOCULTURAL_ANIMATION_URL,
    sourceQuote: "Socorrista en instalaciones acuáticas.",
  },
  "IFC01S|2721": {
    sourceUrl: TODO_FP_ASIR_URL,
    sourceQuote: "Técnica / técnico en administración de base de datos.",
  },
  "IFC01S|2722": {
    sourceUrl: TODO_FP_ASIR_URL,
    sourceQuote: "Técnica / técnico en administración de sistemas.",
  },
  "IFC01S|3812": {
    sourceUrl: TODO_FP_ASIR_URL,
    sourceQuote: "Personal de apoyo y soporte técnico.",
  },
  "IFC01S|3813": {
    sourceUrl: TODO_FP_ASIR_URL,
    sourceQuote: "Técnica / técnico de redes.",
  },
  "IFC01S|3814": {
    sourceUrl: TODO_FP_ASIR_URL,
    sourceQuote: "Técnica / técnico en entornos web.",
  },
  "SSC03S|2312": {
    sourceUrl: TODO_FP_INTEGRATION_URL,
    sourceQuote: "Educador / educadora de educación especial.",
  },
  "SSC03S|3713": {
    sourceUrl: TODO_FP_INTEGRATION_URL,
    sourceQuote: "Técnica / técnico de integración social.",
  },
};

function currentSourceOverride(
  key: string,
): Pick<TrainingOccupationLink, "sourceUrl" | "sourceQuote"> | undefined {
  const baseKey = key
    .replace("AFD01SD|", "AFD01S|")
    .replace("IFC01SD|", "IFC01S|")
    .replace("SSC03SD|", "SSC03S|");
  return CURRENT_SOURCE_OVERRIDES[baseKey];
}

function relationKey(link: TrainingOccupationLink): string {
  return `${link.trainingProgramKey}|${link.occupationId.replace("occupation:cno11:", "")}`;
}

export function mergeFrontierReviewedCoverage(
  currentValue: unknown,
  reviewedValue: unknown,
): TrainingOccupationLink[] {
  const current = TrainingOccupationLinksSchema.parse(currentValue);
  const reviewed = TrainingOccupationLinksSchema.parse(reviewedValue);
  const reviewedByKey = new Map<string, TrainingOccupationLink[]>();

  for (const link of reviewed) {
    const key = relationKey(link);
    reviewedByKey.set(key, [...(reviewedByKey.get(key) ?? []), link]);
  }

  const merged = new Map(current.map((link) => [relationKey(link), link]));
  for (const key of ACCEPTED_RELATION_KEYS) {
    const candidates = (reviewedByKey.get(key) ?? []).filter(
      (link) => link.reviewStatus === "approved",
    );
    if (candidates.length !== 1) {
      throw new Error(
        `Expected one approved reviewed relationship for ${key}; found ${candidates.length}.`,
      );
    }
    const existing = merged.get(key);
    if (existing !== undefined) {
      if (existing.reviewStatus !== "approved") {
        throw new Error(`Current relationship ${key} is not approved.`);
      }
      continue;
    }
    merged.set(key, {
      ...candidates[0],
      ...currentSourceOverride(key),
    });
  }

  return TrainingOccupationLinksSchema.parse([...merged.values()]).sort(
    (left, right) =>
      relationKey(left).localeCompare(relationKey(right), "en") ||
      left.relationshipType.localeCompare(right.relationshipType, "en"),
  );
}

function restore(rootDirectory: string): void {
  const targetPath = resolve(rootDirectory, LINKS_PATH);
  const current = JSON.parse(readFileSync(targetPath, "utf8")) as unknown;
  const reviewed = JSON.parse(
    execFileSync(
      "git",
      ["-C", rootDirectory, "show", `${REVIEWED_SOURCE_COMMIT}:${LINKS_PATH}`],
      { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
    ),
  ) as unknown;
  const merged = mergeFrontierReviewedCoverage(current, reviewed);
  writeFileSync(targetPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  console.log(
    `Restored ${merged.length} reviewed FP↔occupation relationships.`,
  );
}

const isMainModule =
  import.meta.url === pathToFileURL(resolve(process.argv[1])).toString();

if (isMainModule) {
  restore(resolve(process.cwd()));
}
