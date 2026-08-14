import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  EducationCentersSchema,
  GeneratedManifestSchema,
  JobOffersSchema,
  OutcomeIndicatorsSchema,
  TrainingOfferingsSchema,
  TrainingProgramsSchema,
} from "../../data/schemas/generated";
import { sha256Text } from "./hashFile";

const dataDirectory = join(process.cwd(), "public", "data", "v1");

async function readResource(name: string): Promise<string> {
  return readFile(join(dataDirectory, name), "utf8");
}

describe("generated data snapshots", () => {
  it("match their schemas, counts and source hashes", async () => {
    const [
      manifestText,
      programsText,
      centersText,
      offeringsText,
      offersText,
      outcomesText,
    ] = await Promise.all([
      readResource("manifest.json"),
      readResource("programs.json"),
      readResource("centers.json"),
      readResource("training-offerings.json"),
      readResource("job-offers.json"),
      readResource("outcome-indicators.json"),
    ]);
    const manifest = GeneratedManifestSchema.parse(JSON.parse(manifestText));
    const programs = TrainingProgramsSchema.parse(JSON.parse(programsText));
    const centers = EducationCentersSchema.parse(JSON.parse(centersText));
    const offerings = TrainingOfferingsSchema.parse(JSON.parse(offeringsText));
    const offers = JobOffersSchema.parse(JSON.parse(offersText));
    const outcomes = OutcomeIndicatorsSchema.parse(JSON.parse(outcomesText));

    expect(manifest.qualityStatus).toBe("passed");
    expect(manifest.counts).toEqual({
      programs: programs.length,
      centers: centers.length,
      offerings: offerings.length,
      offers: offers.length,
    });
    expect(manifest.sources.training.sha256).toBe(
      sha256Text(`${programsText}${centersText}${offeringsText}`),
    );
    expect(manifest.sources.offers.sha256).toBe(sha256Text(offersText));
    expect(manifest.sources.outcomes?.sha256).toBe(sha256Text(outcomesText));
    expect(manifest.sources.outcomes?.recordCount).toBe(outcomes.length);
  });
});
