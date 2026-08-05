import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";
import { z } from "zod";

export const RequirementCategorySchema = z.enum([
  "qualification_or_specialization",
  "experience",
  "driving_license_or_vehicle",
  "certificate_or_regulated_license",
  "language",
  "schedule_availability",
  "mobility_or_work_mode",
  "unclassified",
]);

export type RequirementCategory = z.infer<typeof RequirementCategorySchema>;

const NonBlankStringSchema = z
  .string()
  .min(1)
  .refine(
    (value) => value.trim().length > 0,
    "Value must contain non-whitespace characters.",
  );

/** Computes the canonical ID without normalizing any evidence bytes. */
export function publishedRequirementId(
  offerId: string,
  category: RequirementCategory,
  sourceQuote: string,
): string {
  const payload = `${offerId}\u0000${category}\u0000${sourceQuote}`;
  return `requirement:${bytesToHex(sha256(utf8ToBytes(payload)))}`;
}

const requirementBaseShape = {
  id: z.string().regex(/^requirement:[a-f0-9]{64}$/u),
  sourceQuote: NonBlankStringSchema,
  parserVersion: z.literal("1.0.0"),
} as const;

const QualificationRequirementSchema = z
  .object({
    ...requirementBaseShape,
    category: z.literal("qualification_or_specialization"),
    normalizedValue: NonBlankStringSchema,
    parserRule: z.literal("qualification.official_title"),
  })
  .strict();

const ExperienceRequirementSchema = z
  .object({
    ...requirementBaseShape,
    category: z.literal("experience"),
    normalizedValue: z.number().int().positive(),
    parserRule: z.enum(["experience.months", "experience.years"]),
  })
  .strict()
  .superRefine((requirement, context) => {
    if (
      requirement.parserRule === "experience.years" &&
      requirement.normalizedValue % 12 !== 0
    ) {
      context.addIssue({
        code: "custom",
        path: ["normalizedValue"],
        message: "Year-based experience must normalize to whole years.",
      });
    }
  });

const drivingValues = {
  "license.driving_b": "B",
  "license.driving_generic": "driving_license",
  "mobility.own_vehicle": "vehicle_owned",
} as const;

const DrivingRequirementSchema = z
  .object({
    ...requirementBaseShape,
    category: z.literal("driving_license_or_vehicle"),
    normalizedValue: z.enum(["B", "driving_license", "vehicle_owned"]),
    parserRule: z.enum([
      "license.driving_b",
      "license.driving_generic",
      "mobility.own_vehicle",
    ]),
  })
  .strict()
  .superRefine((requirement, context) => {
    if (requirement.normalizedValue !== drivingValues[requirement.parserRule]) {
      context.addIssue({
        code: "custom",
        path: ["normalizedValue"],
        message: "Driving requirement value must match its parser rule.",
      });
    }
  });

const credentialValues = {
  "certificate.professional_registration": "professional_registration",
  "certificate.food_handler": "food_handler",
  "license.professional_authorization": "professional_authorization",
} as const;

const CredentialRequirementSchema = z
  .object({
    ...requirementBaseShape,
    category: z.literal("certificate_or_regulated_license"),
    normalizedValue: NonBlankStringSchema,
    parserRule: z.enum([
      "certificate.professional_registration",
      "certificate.food_handler",
      "certificate.professional_certificate",
      "license.professional_authorization",
    ]),
  })
  .strict()
  .superRefine((requirement, context) => {
    const valid =
      requirement.parserRule === "certificate.professional_certificate"
        ? /\bcertificado de profesionalidad\b/iu.test(
            requirement.normalizedValue,
          )
        : requirement.normalizedValue ===
          credentialValues[requirement.parserRule];
    if (!valid) {
      context.addIssue({
        code: "custom",
        path: ["normalizedValue"],
        message: "Credential requirement value must match its parser rule.",
      });
    }
  });

const LanguageRequirementSchema = z
  .object({
    ...requirementBaseShape,
    category: z.literal("language"),
    normalizedValue: NonBlankStringSchema,
    parserRule: z.enum(["language.cefr", "language.named"]),
  })
  .strict()
  .superRefine((requirement, context) => {
    const language =
      "(?:alemán|catalán|español|euskera|francés|gallego|inglés|italiano|portugués|valenciano)";
    const valid =
      requirement.parserRule === "language.cefr"
        ? new RegExp(`^${language}:[ABC][12]$`, "u").test(
            requirement.normalizedValue,
          )
        : new RegExp(`^${language}$`, "u").test(requirement.normalizedValue);
    if (!valid) {
      context.addIssue({
        code: "custom",
        path: ["normalizedValue"],
        message: "Language requirement value must match its parser rule.",
      });
    }
  });

const scheduleValues = {
  "schedule.night_shifts": "night_shifts",
  "schedule.weekends": "weekends",
  "schedule.variable": "variable_schedule",
} as const;

const ScheduleRequirementSchema = z
  .object({
    ...requirementBaseShape,
    category: z.literal("schedule_availability"),
    normalizedValue: z.enum(["night_shifts", "weekends", "variable_schedule"]),
    parserRule: z.enum([
      "schedule.night_shifts",
      "schedule.weekends",
      "schedule.variable",
    ]),
  })
  .strict()
  .superRefine((requirement, context) => {
    if (
      requirement.normalizedValue !== scheduleValues[requirement.parserRule]
    ) {
      context.addIssue({
        code: "custom",
        path: ["normalizedValue"],
        message: "Schedule requirement value must match its parser rule.",
      });
    }
  });

const mobilityValues = {
  "work_mode.remote": "remote",
  "work_mode.hybrid": "hybrid",
  "work_mode.on_site": "on_site",
  "mobility.travel": "travel",
  "mobility.geographic": "geographic_mobility",
} as const;

const MobilityRequirementSchema = z
  .object({
    ...requirementBaseShape,
    category: z.literal("mobility_or_work_mode"),
    normalizedValue: z.enum([
      "remote",
      "hybrid",
      "on_site",
      "travel",
      "geographic_mobility",
    ]),
    parserRule: z.enum([
      "work_mode.remote",
      "work_mode.hybrid",
      "work_mode.on_site",
      "mobility.travel",
      "mobility.geographic",
    ]),
  })
  .strict()
  .superRefine((requirement, context) => {
    if (
      requirement.normalizedValue !== mobilityValues[requirement.parserRule]
    ) {
      context.addIssue({
        code: "custom",
        path: ["normalizedValue"],
        message: "Mobility requirement value must match its parser rule.",
      });
    }
  });

const UnclassifiedRequirementSchema = z
  .object({
    ...requirementBaseShape,
    category: z.literal("unclassified"),
    normalizedValue: z.null(),
    parserRule: z.enum([
      "unclassified.ambiguous_or_negated",
      "unclassified.conservative_fallback",
    ]),
  })
  .strict();

export const PublishedRequirementSchema = z.discriminatedUnion("category", [
  QualificationRequirementSchema,
  ExperienceRequirementSchema,
  DrivingRequirementSchema,
  CredentialRequirementSchema,
  LanguageRequirementSchema,
  ScheduleRequirementSchema,
  MobilityRequirementSchema,
  UnclassifiedRequirementSchema,
]);

export const OfferPublishedRequirementsSchema = z
  .object({
    offerId: NonBlankStringSchema,
    requirements: z.array(PublishedRequirementSchema),
  })
  .strict();

export const PublishedRequirementsResourceSchema = z
  .array(OfferPublishedRequirementsSchema)
  .superRefine((entries, context) => {
    const offerIds = new Set<string>();
    const requirementIds = new Set<string>();

    entries.forEach((entry, entryIndex) => {
      if (offerIds.has(entry.offerId)) {
        context.addIssue({
          code: "custom",
          path: [entryIndex, "offerId"],
          message:
            "Offer IDs must be unique in the published requirements resource.",
        });
      }
      offerIds.add(entry.offerId);

      entry.requirements.forEach((requirement, requirementIndex) => {
        if (
          requirement.id !==
          publishedRequirementId(
            entry.offerId,
            requirement.category,
            requirement.sourceQuote,
          )
        ) {
          context.addIssue({
            code: "custom",
            path: [entryIndex, "requirements", requirementIndex, "id"],
            message:
              "Requirement ID must match its offer, category and exact source quote.",
          });
        }
        if (requirementIds.has(requirement.id)) {
          context.addIssue({
            code: "custom",
            path: [entryIndex, "requirements", requirementIndex, "id"],
            message:
              "Requirement IDs must be unique in the published requirements resource.",
          });
        }
        requirementIds.add(requirement.id);
      });
    });
  });

export type PublishedRequirement = z.infer<typeof PublishedRequirementSchema>;
export type OfferPublishedRequirements = z.infer<
  typeof OfferPublishedRequirementsSchema
>;
