import { z } from "zod";

import { TrainingLevelSchema, type TrainingProgram } from "./generated";

const TodoFpUrlSchema = z
  .string()
  .url()
  .refine(
    (value) => {
      const url = new URL(value);
      return (
        url.protocol === "https:" &&
        url.hostname === "www.todofp.es" &&
        url.pathname.startsWith("/que-estudiar/")
      );
    },
    { message: "Professional profile sources must be official TodoFP pages." },
  );

export const ProfessionalProfileSchema = z
  .object({
    profileId: z.string().regex(/^professional-profile:[a-f0-9]{64}$/u),
    programKey: z.string().min(1),
    programTitle: z.string().min(1),
    officialTitle: z.string().min(1),
    familyCode: z.string().min(1),
    familyName: z.string().min(1),
    level: TrainingLevelSchema,
    outputLabel: z.string().min(3),
    sourceSystem: z.literal("TodoFP"),
    sourceUrl: TodoFpUrlSchema,
    sourceQuote: z.string().min(3),
  })
  .strict()
  .superRefine((profile, context) => {
    if (profile.sourceQuote !== profile.outputLabel) {
      context.addIssue({
        code: "custom",
        path: ["sourceQuote"],
        message: "The displayed output must preserve the literal source quote.",
      });
    }
  });

export const ProfessionalProfilesResourceSchema = z
  .array(ProfessionalProfileSchema)
  .min(1)
  .superRefine((profiles, context) => {
    const ids = new Set<string>();
    for (const [index, profile] of profiles.entries()) {
      if (ids.has(profile.profileId)) {
        context.addIssue({
          code: "custom",
          path: [index, "profileId"],
          message: "Professional profile IDs must be unique.",
        });
      }
      ids.add(profile.profileId);
    }
  });

export type ProfessionalProfile = z.infer<typeof ProfessionalProfileSchema>;

/** Prevents publication unless every current FP program has official outputs. */
export function assertCompleteProfessionalProfileCoverage(
  programs: readonly TrainingProgram[],
  profiles: readonly ProfessionalProfile[],
): void {
  const programsByKey = new Map(
    programs.map((program) => [program.programKey, program]),
  );
  const covered = new Set<string>();

  for (const profile of profiles) {
    const program = programsByKey.get(profile.programKey);
    if (program === undefined) {
      throw new Error(
        `Professional profile references unknown program ${profile.programKey}.`,
      );
    }
    for (const field of [
      "programTitle",
      "familyCode",
      "familyName",
      "level",
    ] as const) {
      if (profile[field] !== program[field]) {
        throw new Error(
          `Professional profile ${profile.profileId} does not match ${profile.programKey}: ${field}.`,
        );
      }
    }
    covered.add(profile.programKey);
  }

  const missing = programs
    .map(({ programKey }) => programKey)
    .filter((programKey) => !covered.has(programKey));
  if (missing.length > 0) {
    throw new Error(
      `Official professional profile coverage is incomplete (${covered.size}/${programs.length}); missing: ${missing.join(", ")}.`,
    );
  }
}
