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

export const PublishedRequirementSchema = z
  .object({
    id: z.string().regex(/^requirement:[a-f0-9]{64}$/u),
    category: RequirementCategorySchema,
    normalizedValue: z
      .union([z.string().min(1), z.number().nonnegative()])
      .nullable(),
    sourceQuote: z.string().min(1),
    parserRule: z.string().regex(/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/u),
    parserVersion: z.literal("1.0.0"),
  })
  .strict()
  .superRefine((requirement, context) => {
    if (
      requirement.category === "unclassified" &&
      requirement.normalizedValue !== null
    ) {
      context.addIssue({
        code: "custom",
        path: ["normalizedValue"],
        message: "Unclassified requirements cannot expose a normalized value.",
      });
    }
  });

export const OfferPublishedRequirementsSchema = z
  .object({
    offerId: z.string().min(1),
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

export type RequirementCategory = z.infer<typeof RequirementCategorySchema>;
export type PublishedRequirement = z.infer<typeof PublishedRequirementSchema>;
export type OfferPublishedRequirements = z.infer<
  typeof OfferPublishedRequirementsSchema
>;
