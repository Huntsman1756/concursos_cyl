import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";
import { z } from "zod";

import { ReviewStatusSchema } from "../schemas/curatedMappings";

const ProgramQualificationIdentityInputSchema = z
  .object({
    programKey: z.string().trim().min(1),
    qualificationCatalogId: z.string().regex(/^qualification:[a-z0-9-]+$/u),
    reviewStatus: ReviewStatusSchema,
    sourceUrl: z.string().url(),
    sourceQuote: z.string().trim().min(20).max(280),
    reviewedAt: z.string().date(),
    mappingVersion: z.string().regex(/^\d+\.\d+\.\d+$/u),
    reviewNote: z.string().trim().min(20).max(500).optional(),
  })
  .strict()
  .superRefine((link, context) => {
    if (link.reviewStatus === "draft" && link.reviewNote === undefined) {
      context.addIssue({
        code: "custom",
        path: ["reviewNote"],
        message: "Draft program qualification links require a review note.",
      });
    }
  });

export type ProgramQualificationLinkIdentityInput = z.infer<
  typeof ProgramQualificationIdentityInputSchema
>;

export function programQualificationLinkIdentity(
  input: ProgramQualificationLinkIdentityInput,
): string {
  const link = ProgramQualificationIdentityInputSchema.parse({
    programKey: input.programKey,
    qualificationCatalogId: input.qualificationCatalogId,
    reviewStatus: input.reviewStatus,
    sourceUrl: input.sourceUrl,
    sourceQuote: input.sourceQuote,
    reviewedAt: input.reviewedAt,
    mappingVersion: input.mappingVersion,
    reviewNote: input.reviewNote,
  });
  const payload = [
    link.programKey,
    link.qualificationCatalogId,
    link.reviewStatus,
    link.mappingVersion,
    link.sourceUrl,
    link.sourceQuote,
    link.reviewedAt,
    link.reviewNote ?? "",
  ].join("\u0000");
  return `program-qualification-link:${bytesToHex(sha256(utf8ToBytes(payload)))}`;
}

export const ProgramQualificationLinkSchema =
  ProgramQualificationIdentityInputSchema.safeExtend({
    identity: z.string().regex(/^program-qualification-link:[a-f0-9]{64}$/u),
  }).superRefine((link, context) => {
    if (link.identity !== programQualificationLinkIdentity(link)) {
      context.addIssue({
        code: "custom",
        path: ["identity"],
        message: "Program qualification link identity must match its payload.",
      });
    }
  });

export type ProgramQualificationLink = z.infer<
  typeof ProgramQualificationLinkSchema
>;

export const ProgramQualificationLinksSchema = z
  .array(ProgramQualificationLinkSchema)
  .superRefine((links, context) => {
    const identities = new Set<string>();
    const relationships = new Set<string>();
    links.forEach((link, index) => {
      if (identities.has(link.identity)) {
        context.addIssue({
          code: "custom",
          path: [index, "identity"],
          message: "Program qualification link identities must be unique.",
        });
      }
      identities.add(link.identity);
      const relationship = `${link.programKey}\u0000${link.qualificationCatalogId}`;
      if (relationships.has(relationship)) {
        context.addIssue({
          code: "custom",
          path: [index],
          message: "Program and qualification relationships must be unique.",
        });
      }
      relationships.add(relationship);
    });
  });

function reviewedLink(
  input: ProgramQualificationLinkIdentityInput,
): ProgramQualificationLink {
  return ProgramQualificationLinkSchema.parse({
    ...input,
    identity: programQualificationLinkIdentity(input),
  });
}

const dawLinkBase = {
  qualificationCatalogId:
    "qualification:web-application-development-higher-technician",
  reviewStatus: "approved",
  sourceUrl: "https://www.boe.es/eli/es/rd/2010/05/20/686",
  sourceQuote:
    "El título de Técnico Superior en Desarrollo de Aplicaciones Web queda identificado por los siguientes elementos:",
  reviewedAt: "2026-08-05",
  mappingVersion: "1.0.0",
} as const;

export const REVIEWED_PROGRAM_QUALIFICATION_LINKS =
  ProgramQualificationLinksSchema.parse([
    reviewedLink({ ...dawLinkBase, programKey: "IFC03S" }),
    reviewedLink({ ...dawLinkBase, programKey: "IFC03SD" }),
  ]);
