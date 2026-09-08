import { z } from "zod";

export const CENTER_LINK_POLICY_PATH = "/qa/center-link-policy.json";

const CenterLinkPolicyEntrySchema = z
  .object({
    cta: z.enum(["website", "source_published"]),
    classification: z.string(),
    identity: z.string(),
  })
  .strict();

export const CenterLinkPolicySchema = z
  .object({
    kind: z.literal("salida-cyl-center-link-policy"),
    version: z.string(),
    derivedFrom: z.string(),
    auditedAt: z.string(),
    finishedAt: z.string(),
    snapshotId: z.string(),
    policy: z.object({
      website: z.string(),
      sourcePublished: z.string(),
      note: z.string(),
    }),
    centers: z.record(z.string(), CenterLinkPolicyEntrySchema),
  })
  .strict();

export type CenterLinkPolicy = z.infer<typeof CenterLinkPolicySchema>;

/**
 * Loads the dated center-link QA policy overlay. This artifact is a
 * presentation-layer derivation of the design-phase link audit — it is NOT
 * canonical source data and lives outside public/data/v1.
 *
 * Fail-safe: if the artifact is missing, malformed, or otherwise
 * unloadable, this resolves to null and the UI must not show any website
 * CTA (the pre-audit behaviour of showing every published URL is never
 * restored).
 */
export async function loadCenterLinkPolicy(options?: {
  signal?: AbortSignal;
}): Promise<CenterLinkPolicy | null> {
  try {
    const response = await fetch(CENTER_LINK_POLICY_PATH, {
      cache: "no-store",
      ...(options?.signal === undefined ? {} : { signal: options.signal }),
    });
    if (!response.ok) return null;
    return CenterLinkPolicySchema.parse(await response.json());
  } catch {
    return null;
  }
}

export type CenterWebsiteCta = "Web del centro" | "Web publicada en la fuente";

export function centerWebsiteCtaFor(
  policy: CenterLinkPolicy | null,
  centerCode: string,
): CenterWebsiteCta | null {
  if (policy === null) return null;
  const entry = policy.centers[centerCode];
  if (entry === undefined) return null;
  return entry.cta === "source_published"
    ? "Web publicada en la fuente"
    : "Web del centro";
}
