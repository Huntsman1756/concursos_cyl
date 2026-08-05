import { createHash } from "node:crypto";

import {
  PublishedRequirementSchema,
  PublishedRequirementsResourceSchema,
  type PublishedRequirement,
  type RequirementCategory,
} from "../../src/domain/requirements";

export { PublishedRequirementsResourceSchema };

interface RequirementDescription {
  sections: {
    requirements: readonly string[];
  };
}

interface ClassifiedRequirement {
  category: Exclude<RequirementCategory, "unclassified">;
  normalizedValue: string | number;
  parserRule: string;
}

const PARSER_VERSION = "1.0.0" as const;
const OPTIONAL_OR_AMBIGUOUS =
  /\b(?:se\s+valorar[aá]|valorable|preferible|deseable|ser[ií]a\s+un\s+plus|a\s+valorar)\b/iu;
const NEGATED =
  /\b(?:no\s+se\s+requiere|no\s+es\s+necesari[oa]|sin\s+necesidad\s+de|no\s+obligatori[oa])\b/iu;

const NUMBER_WORDS: Readonly<Record<string, number>> = {
  un: 1,
  una: 1,
  uno: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  doce: 12,
};

const LANGUAGE_NAMES: Readonly<Record<string, string>> = {
  aleman: "alemán",
  catalan: "catalán",
  castellano: "español",
  euskera: "euskera",
  espanol: "español",
  frances: "francés",
  gallego: "gallego",
  ingles: "inglés",
  italiano: "italiano",
  portugues: "portugués",
  valenciano: "valenciano",
};

function searchableText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es-ES")
    .replace(/^[\s•·▪◦*-]+/u, "")
    .replace(/[^\p{Letter}\p{Number}+/]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function quoteValue(value: string): string {
  return value
    .trim()
    .replace(/^[\s•·▪◦*-]+/u, "")
    .replace(/[.;:,]+$/u, "")
    .trim();
}

function requirementId(
  offerId: string,
  category: RequirementCategory,
  sourceQuote: string,
): string {
  const digest = createHash("sha256")
    .update(`${offerId}\u0000${category}\u0000${sourceQuote}`, "utf8")
    .digest("hex");
  return `requirement:${digest}`;
}

function qualificationRule(
  sourceQuote: string,
  text: string,
): ClassifiedRequirement | undefined {
  if (
    !/\b(?:bachiller|graduad[oa]\s+en\s+eso|fp\s+b[aá]sica|t[eé]cnic[oa](?:\/a)?(?:\s+superior)?\s+en|grado\s+(?:en|de)|licenciad[oa]\s+en|diplomad[oa]\s+en|ingenier[íi]a\s+(?:en|de)|m[aá]ster\s+en|doctorado\s+en|titulaci[oó]n\s+(?:en|de))\b/iu.test(
      text,
    )
  ) {
    return undefined;
  }

  return {
    category: "qualification_or_specialization",
    normalizedValue: quoteValue(sourceQuote),
    parserRule: "qualification.official_title",
  };
}

function experienceRule(text: string): ClassifiedRequirement | undefined {
  if (
    !/\bexperiencia\b/u.test(text) ||
    /\b(?:menos\s+de|hasta|entre|aproximadamente)\b/u.test(text)
  ) {
    return undefined;
  }

  const duration =
    /\bexperiencia\b.{0,60}?\b(\d+|un|una|uno|dos|tres|cuatro|cinco|seis|doce)\s+(mes|meses|ano|anos)\b/u.exec(
      text,
    );
  if (duration === null) return undefined;

  const amount = /^\d+$/u.test(duration[1])
    ? Number(duration[1])
    : NUMBER_WORDS[duration[1]];
  if (amount === undefined || amount <= 0) return undefined;
  const years = duration[2] === "ano" || duration[2] === "anos";

  return {
    category: "experience",
    normalizedValue: years ? amount * 12 : amount,
    parserRule: years ? "experience.years" : "experience.months",
  };
}

function drivingRule(text: string): ClassifiedRequirement | undefined {
  const licenceB =
    /\b(?:permiso|carnet|carne)\s+(?:de\s+)?conducir\b.{0,24}?\b(?:tipo\s+)?b\b/u.test(
      text,
    );
  if (licenceB) {
    return {
      category: "driving_license_or_vehicle",
      normalizedValue: "B",
      parserRule: "license.driving_b",
    };
  }
  if (/\b(?:permiso|carnet|carne)\s+(?:de\s+)?conducir\b/u.test(text)) {
    return {
      category: "driving_license_or_vehicle",
      normalizedValue: "driving_license",
      parserRule: "license.driving_generic",
    };
  }
  if (/\bveh[ií]culo\s+propio\b/iu.test(text)) {
    return {
      category: "driving_license_or_vehicle",
      normalizedValue: "vehicle_owned",
      parserRule: "mobility.own_vehicle",
    };
  }
  return undefined;
}

function regulatedCredentialRule(
  text: string,
): ClassifiedRequirement | undefined {
  if (/\bcolegiaci[oó]n\s+(?:profesional\s+)?vigente\b/iu.test(text)) {
    return {
      category: "certificate_or_regulated_license",
      normalizedValue: "professional_registration",
      parserRule: "certificate.professional_registration",
    };
  }
  if (
    /\b(?:carnet|carn[eé])\s+de\s+manipulador(?:a)?\s+de\s+alimentos\b/iu.test(
      text,
    )
  ) {
    return {
      category: "certificate_or_regulated_license",
      normalizedValue: "food_handler",
      parserRule: "certificate.food_handler",
    };
  }
  if (/\bcertificado\s+de\s+profesionalidad\b/iu.test(text)) {
    return {
      category: "certificate_or_regulated_license",
      normalizedValue: quoteValue(text),
      parserRule: "certificate.professional_certificate",
    };
  }
  if (/\bhabilitaci[oó]n\s+profesional\b/iu.test(text)) {
    return {
      category: "certificate_or_regulated_license",
      normalizedValue: "professional_authorization",
      parserRule: "license.professional_authorization",
    };
  }
  return undefined;
}

function languageRule(text: string): ClassifiedRequirement | undefined {
  const languages = new Set(
    Object.entries(LANGUAGE_NAMES)
      .filter(([name]) => new RegExp(`\\b${name}\\b`, "u").test(text))
      .map(([, language]) => language),
  );
  if (languages.size !== 1) return undefined;

  const levels = [...text.matchAll(/\b([abc][12])\b/gu)].map((match) =>
    match[1].toUpperCase(),
  );
  const uniqueLevels = [...new Set(levels)];
  if (uniqueLevels.length > 1) return undefined;
  const language = [...languages][0];

  return {
    category: "language",
    normalizedValue:
      uniqueLevels.length === 1 ? `${language}:${uniqueLevels[0]}` : language,
    parserRule: uniqueLevels.length === 1 ? "language.cefr" : "language.named",
  };
}

function scheduleRule(text: string): ClassifiedRequirement | undefined {
  if (/\b(?:turnos?\s+de\s+noche|turnos?\s+nocturnos?|noches?)\b/u.test(text)) {
    return {
      category: "schedule_availability",
      normalizedValue: "night_shifts",
      parserRule: "schedule.night_shifts",
    };
  }
  if (/\b(?:fines?\s+de\s+semana|s[aá]bados?|domingos?)\b/iu.test(text)) {
    return {
      category: "schedule_availability",
      normalizedValue: "weekends",
      parserRule: "schedule.weekends",
    };
  }
  if (/\b(?:turnos?\s+rotativos?|disponibilidad\s+horaria)\b/u.test(text)) {
    return {
      category: "schedule_availability",
      normalizedValue: "variable_schedule",
      parserRule: "schedule.variable",
    };
  }
  return undefined;
}

function mobilityRule(text: string): ClassifiedRequirement | undefined {
  const candidates: ClassifiedRequirement[] = [];
  if (/\b(?:teletrabajo|trabajo\s+remoto|modalidad\s+remota)\b/u.test(text)) {
    candidates.push({
      category: "mobility_or_work_mode",
      normalizedValue: "remote",
      parserRule: "work_mode.remote",
    });
  }
  if (/\b(?:h[ií]brid[oa]|modalidad\s+mixta)\b/iu.test(text)) {
    candidates.push({
      category: "mobility_or_work_mode",
      normalizedValue: "hybrid",
      parserRule: "work_mode.hybrid",
    });
  }
  if (/\b(?:presencial|trabajo\s+en\s+centro)\b/u.test(text)) {
    candidates.push({
      category: "mobility_or_work_mode",
      normalizedValue: "on_site",
      parserRule: "work_mode.on_site",
    });
  }
  if (
    /\b(?:disponibilidad\s+para\s+viajar|viajes?\s+frecuentes?)\b/u.test(text)
  ) {
    candidates.push({
      category: "mobility_or_work_mode",
      normalizedValue: "travel",
      parserRule: "mobility.travel",
    });
  }
  if (
    /\b(?:disponibilidad\s+para\s+desplazarse|movilidad\s+geogr[aá]fica)\b/iu.test(
      text,
    )
  ) {
    candidates.push({
      category: "mobility_or_work_mode",
      normalizedValue: "geographic_mobility",
      parserRule: "mobility.geographic",
    });
  }

  return candidates.length === 1 ? candidates[0] : undefined;
}

function classify(sourceQuote: string): ClassifiedRequirement | undefined {
  const text = searchableText(sourceQuote);
  if (
    text.length === 0 ||
    OPTIONAL_OR_AMBIGUOUS.test(text) ||
    NEGATED.test(text)
  ) {
    return undefined;
  }

  const matches = [
    qualificationRule(sourceQuote, text),
    experienceRule(text),
    drivingRule(text),
    regulatedCredentialRule(text),
    languageRule(text),
    scheduleRule(text),
    mobilityRule(text),
  ].filter((match): match is ClassifiedRequirement => match !== undefined);

  if (matches.length !== 1) return undefined;
  return matches[0];
}

/** Extracts deterministic evidence only from the sanitized requirements section. */
export function extractPublishedRequirements(
  offerId: string,
  description: RequirementDescription,
): PublishedRequirement[] {
  const normalizedOfferId = offerId.trim();
  if (normalizedOfferId.length === 0) {
    throw new Error("Offer ID must not be blank.");
  }

  const seenQuotes = new Set<string>();
  const results: PublishedRequirement[] = [];

  for (const rawQuote of description.sections.requirements) {
    const sourceQuote = rawQuote.trim();
    if (sourceQuote.length === 0 || seenQuotes.has(sourceQuote)) continue;
    seenQuotes.add(sourceQuote);

    const classified = classify(sourceQuote);
    const category = classified?.category ?? "unclassified";
    results.push(
      PublishedRequirementSchema.parse({
        id: requirementId(normalizedOfferId, category, sourceQuote),
        category,
        normalizedValue: classified?.normalizedValue ?? null,
        sourceQuote,
        parserRule:
          classified?.parserRule ?? "unclassified.conservative_fallback",
        parserVersion: PARSER_VERSION,
      }),
    );
  }

  return results;
}
