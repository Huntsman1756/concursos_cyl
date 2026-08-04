import { z } from "zod";

/** Exact coordinate signature shared by the Junta source records. */
export const SourceGeoPointSchema = z
  .object({
    lon: z.number(),
    lat: z.number(),
  })
  .strict();
