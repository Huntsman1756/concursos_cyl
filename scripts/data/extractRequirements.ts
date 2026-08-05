import {
  PublishedRequirementSchema,
  PublishedRequirementsResourceSchema,
  publishedRequirementId,
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
const OPTIONAL =
  /\b(?:opcional(?:es|mente)?|preferentemente|preferibles?|deseables?|recomendables?|convenientes?|valorables?|valorad[oa]s?|se\s+valorara|se\s+valoraran|se\s+valoraria|se\s+valorarian|se\s+valorase|se\s+valorasen|se\s+valora|se\s+valoran|valoramos|(?:la|lo|las|los)\s+valorariamos|a\s+valorar|seria\s+un\s+plus|un\s+plus)\b/u;
const EXPLICIT_NEGATION =
  /\b(?:no\s+requerid[oa]s?|no\s+se\s+requiere|no\s+es\s+necesari[oa]|no\s+hace\s+falta|sin\s+necesidad\s+de|no\s+imprescindible|no\s+obligatori[oa])\b/u;
const SCOPED_SIN_NEGATION =
  /\bsin\s+(?:experiencia|disponibilidad|permiso(?:\s+de\s+conducir)?|carnet|carne|vehiculo|titulacion|titulo|certificado|colegiacion|habilitacion)\b/u;
const CONDITIONAL_OR_TENTATIVE =
  /(?:\bsi\b|\bsiempre\s+que\b|\ben\s+(?:caso\s+de|su\s+caso)\b|\bcuando\s+(?:proceda|corresponda|aplique)\b|\bde\s+(?:ser\s+posible|poder\s+ser)\b|\b(?:(?:se\s+)?podri(?:a|an)\s+valorar(?:se)?|podri(?:a|an)\s+valorarse)\b)/u;

const AFFIRMATIVE_SI_TOKEN = "affirmativesi";
const EXPLICIT_PREFIX =
  "(?:(?:observaciones|requisitos?)\\s+)?(?:affirmativesi\\s+)?(?:(?:(?:se\\s+)?(?:requiere|exige)|es\\s+(?:necesario|imprescindible)|requisito|disponer\\s+de)\\s+)?";
const NEUTRAL_SUFFIX =
  "(?:\\s+sin\\s+(?:restricciones|incidencias|interrupciones|limitaciones))?";

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

function protectAffirmativeSi(value: string): string {
  return value
    .toLocaleLowerCase("es-ES")
    .replace(
      /(^|[^\p{Letter}])sí(?=$|[^\p{Letter}])/gu,
      `$1${AFFIRMATIVE_SI_TOKEN}`,
    );
}

function searchableText(value: string): string {
  return protectAffirmativeSi(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/^[\s•·▪◦*-]+/u, "")
    .replace(/[^\p{Letter}\p{Number}+/]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function ambiguityText(value: string): string {
  return protectAffirmativeSi(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
}

function hasAmbiguousExperienceDuration(sourceQuote: string): boolean {
  const text = ambiguityText(sourceQuote);
  if (!/\bexperiencia\b/u.test(text)) return false;

  const number = "(?:\\d+|un|una|uno|dos|tres|cuatro|cinco|seis|doce)";
  const unit = "(?:anos?|mes(?:es)?)";
  const rangePatterns = [
    new RegExp(`\\bentre\\s+${number}\\s+(?:y|a)\\s+${number}\\b`, "u"),
    new RegExp(`\\b${number}\\s+(?:a|o)\\s+${number}\\s+${unit}\\b`, "u"),
    new RegExp(`\\b${number}\\s*[-–]\\s*${number}\\s+${unit}\\b`, "u"),
    new RegExp(`\\b${number}\\s*\\/\\s*${number}\\s+${unit}\\b`, "u"),
    new RegExp(`\\b${number}\\s+anos?\\s+y\\s+medio\\b`, "u"),
    /\b\d+[,.]\d+\s+(?:anos?|mes(?:es)?)\b/u,
    /\b(?:mas\s+de|superior\s+a)\s+\d+\s+(?:anos?|mes(?:es)?)\b/u,
  ];
  if (rangePatterns.some((pattern) => pattern.test(text))) return true;

  const durations = [
    ...text.matchAll(new RegExp(`\\b${number}\\s+${unit}\\b`, "gu")),
  ];
  return durations.length > 1;
}

function isAmbiguousOrNegated(sourceQuote: string): boolean {
  const text = searchableText(sourceQuote);
  const clauseText = ambiguityText(sourceQuote);
  return (
    OPTIONAL.test(text) ||
    EXPLICIT_NEGATION.test(text) ||
    SCOPED_SIN_NEGATION.test(text) ||
    CONDITIONAL_OR_TENTATIVE.test(clauseText) ||
    hasAmbiguousExperienceDuration(sourceQuote)
  );
}

function quoteValue(value: string): string {
  return value
    .trim()
    .replace(/^[\s•·▪◦*-]+/u, "")
    .replace(/[.;:,]+$/u, "")
    .trim();
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
    /\b(?:permiso|carnet|carne)\s+(?:de\s+)?(?:conducir|conduccion)\b.{0,24}?\b(?:tipo\s+)?b\b/u.test(
      text,
    );
  if (licenceB) {
    return {
      category: "driving_license_or_vehicle",
      normalizedValue: "B",
      parserRule: "license.driving_b",
    };
  }
  if (
    /\b(?:permiso|carnet|carne)\s+(?:de\s+)?(?:conducir|conduccion)\b/u.test(
      text,
    )
  ) {
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
  if (text.length === 0) return undefined;

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

/**
 * A recognized token is not enough to claim a requirement. The complete item
 * must match one of these deliberately small grammars; otherwise its remaining
 * prose may change the meaning and the extractor fails closed.
 */
function hasExplicitRequirementGrammar(
  sourceQuote: string,
  classified: ClassifiedRequirement,
): boolean {
  const text = searchableText(sourceQuote);
  const anchored = (body: string): boolean =>
    new RegExp(`^${EXPLICIT_PREFIX}(?:${body})${NEUTRAL_SUFFIX}$`, "u").test(
      text,
    );

  switch (classified.parserRule) {
    case "license.driving_b":
      return anchored(
        "(?:permiso|carnet|carne)\\s+(?:de\\s+)?(?:conducir|conduccion)(?:\\s+(?:tipo|clase))?\\s+b(?:\\s+y\\s+vehiculo\\s+propio)?(?:\\s+obligatori[oa])?(?:\\s+en\\s+vigor)?(?:\\s+para\\s+centro\\s+preferente)?",
      );
    case "license.driving_generic":
      return anchored(
        "(?:permiso|carnet|carne)\\s+(?:de\\s+)?(?:conducir|conduccion)(?:\\s+obligatori[oa])?(?:\\s+en\\s+vigor)?",
      );
    case "mobility.own_vehicle":
      return anchored(
        "vehiculo\\s+propio(?:\\s+obligatorio)?(?:\\s+para\\s+acudir\\s+al\\s+centro\\s+de\\s+trabajo)?",
      );
    case "experience.years":
    case "experience.months":
      return anchored(
        "experiencia(?:\\s+(?:laboral|profesional))?(?:\\s+minima)?(?:\\s+de)?(?:\\s+al\\s+menos)?\\s+(?:\\d+|un|una|uno|dos|tres|cuatro|cinco|seis|doce)\\s+(?:anos?|mes(?:es)?)",
      );
    case "qualification.official_title":
      return anchored(
        "(?:bachiller(?:\\s+o\\s+equivalente)?|graduad[oa]\\s+en\\s+eso(?:\\s+o\\s+equivalente)?|fp\\s+basica|tecnic[oa](?:/a)?(?:\\s+superior)?\\s+en\\s+[\\p{Letter}\\p{Number}+/]+(?:\\s+[\\p{Letter}\\p{Number}+/]+)*|(?:grado|licenciad[oa]|diplomad[oa]|ingenieria|master|doctorado|titulacion)\\s+(?:en|de)\\s+[\\p{Letter}\\p{Number}+/]+(?:\\s+[\\p{Letter}\\p{Number}+/]+)*)",
      );
    case "certificate.professional_registration":
      return anchored("colegiacion(?:\\s+profesional)?\\s+vigente");
    case "certificate.food_handler":
      return anchored(
        "(?:carnet|carne)\\s+de\\s+manipulador(?:a)?\\s+de\\s+alimentos",
      );
    case "certificate.professional_certificate":
      return anchored(
        "certificado\\s+de\\s+profesionalidad(?:\\s+[\\p{Letter}\\p{Number}+/]+)*",
      );
    case "license.professional_authorization":
      return anchored("habilitacion\\s+profesional");
    case "language.cefr":
      return (
        anchored(
          "(?:(?:idiomas?|nivel|conocimiento\\s+del\\s+idioma|dominio\\s+del\\s+idioma)\\s+)?(?:aleman|catalan|castellano|euskera|espanol|frances|gallego|ingles|italiano|portugues|valenciano)(?:\\s+nivel)?\\s+[abc][12]",
        ) ||
        anchored(
          "nivel\\s+[abc][12](?:\\s+o\\s+superior)?\\s+de\\s+(?:aleman|catalan|castellano|euskera|espanol|frances|gallego|ingles|italiano|portugues|valenciano)",
        )
      );
    case "language.named":
      return anchored(
        "(?:(?:idioma|conocimiento\\s+del\\s+idioma|dominio\\s+del\\s+idioma)\\s+)?(?:aleman|catalan|castellano|euskera|espanol|frances|gallego|ingles|italiano|portugues|valenciano)",
      );
    case "schedule.night_shifts":
      return anchored(
        "(?:disponibilidad\\s+para\\s+trabajar\\s+en\\s+)?(?:turnos?\\s+de\\s+noche|turnos?\\s+nocturnos?|noches?|turnos?\\s+rotativos?\\s+de\\s+manana\\s+tarde\\s+y\\s+noche)",
      );
    case "schedule.weekends":
      return anchored(
        "(?:disponibilidad\\s+para\\s+trabajar\\s+en\\s+)?(?:fines?\\s+de\\s+semana|sabados?|domingos?)|horarios\\s+en\\s+turnos?\\s+rotativos?\\s+de\\s+lunes\\s+a\\s+sabados",
      );
    case "schedule.variable":
      return anchored(
        "(?:(?:horarios\\s+en|disponibilidad\\s+para\\s+trabajar\\s+en|flexibilidad\\s+y\\s+disponibilidad\\s+para\\s+trabajar\\s+en)\\s+)?turnos?\\s+rotativos?(?:\\s+de\\s+(?:lunes\\s+a\\s+sabados|manana\\s+tarde\\s+y\\s+noche))?|disponibilidad\\s+horaria",
      );
    case "work_mode.remote":
      return anchored("(?:teletrabajo|trabajo\\s+remoto|modalidad\\s+remota)");
    case "work_mode.hybrid":
      return anchored(
        "(?:(?:modalidad\\s+de\\s+trabajo|trabajo)\\s+)?(?:hibrid[oa]|modalidad\\s+mixta)",
      );
    case "work_mode.on_site":
      return anchored("(?:trabajo\\s+)?(?:presencial|trabajo\\s+en\\s+centro)");
    case "mobility.travel":
      return anchored(
        "(?:disponibilidad\\s+para\\s+viajar|viajes?\\s+frecuentes?)",
      );
    case "mobility.geographic":
      return anchored(
        "(?:disponibilidad\\s+para\\s+desplazarse|movilidad\\s+geografica)",
      );
    default:
      return false;
  }
}

/** Extracts deterministic evidence only from the sanitized requirements section. */
export function extractPublishedRequirements(
  offerId: string,
  description: RequirementDescription,
): PublishedRequirement[] {
  if (offerId.trim().length === 0) {
    throw new Error("Offer ID must not be blank.");
  }

  const seenQuotes = new Set<string>();
  const results: PublishedRequirement[] = [];

  for (const rawQuote of description.sections.requirements) {
    const sourceQuote = rawQuote;
    if (sourceQuote.trim().length === 0 || seenQuotes.has(sourceQuote))
      continue;
    seenQuotes.add(sourceQuote);

    const markerAmbiguousOrNegated = isAmbiguousOrNegated(sourceQuote);
    const candidate = markerAmbiguousOrNegated
      ? undefined
      : classify(sourceQuote);
    const grammarAccepted =
      candidate !== undefined &&
      hasExplicitRequirementGrammar(sourceQuote, candidate);
    const ambiguousOrNegated =
      markerAmbiguousOrNegated || (candidate !== undefined && !grammarAccepted);
    const classified = grammarAccepted ? candidate : undefined;
    const category = classified?.category ?? "unclassified";
    results.push(
      PublishedRequirementSchema.parse({
        id: publishedRequirementId(offerId, category, sourceQuote),
        category,
        normalizedValue: classified?.normalizedValue ?? null,
        sourceQuote,
        parserRule:
          classified?.parserRule ??
          (ambiguousOrNegated
            ? "unclassified.ambiguous_or_negated"
            : "unclassified.conservative_fallback"),
        parserVersion: PARSER_VERSION,
      }),
    );
  }

  return results;
}
