import type {
  PublishedRequirement,
  RequirementCategory,
} from "../../data/schemas/generated";

export type { PublishedRequirement, RequirementCategory };

const parserVersion = "1.0.0" as const;

export interface RequirementsDescription {
  sections: {
    requirements: string[];
  };
}

interface RuleMatch {
  category: RequirementCategory;
  normalizedValue: string | number | null;
  parserRule: string;
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function normalized(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
}

function classifyRequirement(quote: string): RuleMatch | null {
  const value = normalized(quote);
  const matches: RuleMatch[] = [];

  const license = value.match(
    /(?:permisos?|carne|carnet)\s+(?:de\s+)?conducir\s*([a-z])/i,
  );
  if (license) {
    matches.push({
      category: "driving_license_or_vehicle",
      normalizedValue: license[1].toUpperCase(),
      parserRule: "license.driving_class",
    });
  }
  if (/vehiculo\s+propio|vehículo\s+propio/.test(quote)) {
    if (!license) {
      matches.push({
        category: "driving_license_or_vehicle",
        normalizedValue: "vehicle",
        parserRule: "license.vehicle_own",
      });
    }
  }

  const experience = value.match(/(\d+)\s*(?:anos|años|mes(?:es)?)/i);
  if (experience) {
    const amount = Number(experience[1]);
    const months = /mes/.test(value) ? amount : amount * 12;
    matches.push({
      category: "experience",
      normalizedValue: months,
      parserRule: "experience.months",
    });
  }

  const language = value.match(
    /\b(?:ingles|inglés|frances|francés|aleman|alemán)\s+(a1|a2|b1|b2|c1|c2)\b/i,
  );
  if (language) {
    matches.push({
      category: "language",
      normalizedValue: language[1].toUpperCase(),
      parserRule: "language.cefr",
    });
  }

  if (
    /certificado|habilitacion|habilitación|licencia profesional|tarjeta profesional/.test(
      value,
    )
  ) {
    matches.push({
      category: "certificate_or_regulated_license",
      normalizedValue: null,
      parserRule: "certificate.explicit",
    });
  }

  if (
    /titulacion|titulación|formacion profesional|formación profesional|ciclo formativo|grado universitario/.test(
      value,
    )
  ) {
    matches.push({
      category: "qualification_or_specialization",
      normalizedValue: null,
      parserRule: "qualification.explicit",
    });
  }

  if (
    /jornada completa|jornada parcial|turno|horario|nocturno|fines de semana/.test(
      value,
    )
  ) {
    matches.push({
      category: "schedule_availability",
      normalizedValue: null,
      parserRule: "schedule.explicit",
    });
  }

  if (
    /teletrabajo|remoto|hibrido|híbrido|presencial|disponibilidad para viajar|movilidad geografica|movilidad geográfica/.test(
      value,
    )
  ) {
    const normalizedValue = /teletrabajo|remoto/.test(value)
      ? "remote"
      : /hibrido|híbrido/.test(value)
        ? "hybrid"
        : /presencial/.test(value)
          ? "on_site"
          : null;
    matches.push({
      category: "mobility_or_work_mode",
      normalizedValue,
      parserRule: "work_mode.explicit",
    });
  }

  const categories = new Set(matches.map((match) => match.category));
  if (categories.size !== 1) return null;
  return matches[0];
}

export function extractPublishedRequirements(
  offerId: string,
  description: RequirementsDescription | string[],
): PublishedRequirement[] {
  const quotes = Array.isArray(description)
    ? description
    : description.sections.requirements;
  return quotes.flatMap((rawQuote) => {
    const sourceQuote = rawQuote.trim();
    if (!sourceQuote) return [];
    const match = classifyRequirement(sourceQuote);
    return [
      {
        id: `requirement:${stableHash(`${offerId}|${sourceQuote}`)}`,
        category: match?.category ?? "unclassified",
        normalizedValue: match?.normalizedValue ?? null,
        sourceQuote,
        parserRule: match?.parserRule ?? "unclassified.ambiguous",
        parserVersion,
      },
    ];
  });
}
