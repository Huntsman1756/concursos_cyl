import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import type {
  Occupation,
  TrainingOccupationLink,
} from "../../data/schemas/curatedMappings";

export interface SepeOccupationMarketCatalogueRecord {
  classificationCode: string;
  preferredLabel: string;
  confirmationLabel?: string;
}

function occupationCode(occupation: Occupation): string {
  return occupation.classificationCode;
}

export function buildSepeOccupationCatalogue(
  links: readonly TrainingOccupationLink[],
  occupations: readonly Occupation[],
): SepeOccupationMarketCatalogueRecord[] {
  const approvedLinks = links.filter(
    (link) => link.reviewStatus === "approved",
  );
  const occupationsByCode = new Map<string, Occupation>();
  for (const occupation of occupations) {
    if (occupation.reviewStatus !== "approved") continue;
    const code = occupationCode(occupation);
    const previous = occupationsByCode.get(code);
    if (
      previous !== undefined &&
      (previous.preferredLabel !== occupation.preferredLabel ||
        previous.confirmationLabel !== occupation.confirmationLabel)
    ) {
      throw new Error(
        `SEPE occupation catalogue has conflicting labels for CNO ${code}.`,
      );
    }
    occupationsByCode.set(code, occupation);
  }

  const requestedCodes = new Set<string>();
  for (const link of approvedLinks) {
    const match = /^occupation:cno11:(\d{4})$/u.exec(link.occupationId);
    if (match === null) {
      throw new Error(
        `SEPE occupation catalogue relationship has an invalid occupation ID: ${link.occupationId}.`,
      );
    }
    requestedCodes.add(match[1] as string);
  }

  return [...requestedCodes].sort().map((code) => {
    const occupation = occupationsByCode.get(code);
    if (occupation === undefined) {
      throw new Error(
        `SEPE occupation catalogue has no approved occupation label for CNO ${code}.`,
      );
    }
    return {
      classificationCode: code,
      preferredLabel: occupation.preferredLabel,
      confirmationLabel: occupation.confirmationLabel,
    };
  });
}

interface CliArguments {
  linksPath: string;
  occupationsPath: string;
  outputPath: string;
}

function cliArguments(argv: readonly string[]): CliArguments {
  const values = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument?.startsWith("--")) {
      throw new Error(`Unknown argument: ${argument ?? ""}.`);
    }
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`Missing value for ${argument}.`);
    }
    values.set(argument.slice(2), value);
    index += 1;
  }
  return {
    linksPath: resolve(
      values.get("links") ?? "data/curated/training-occupation-links.json",
    ),
    occupationsPath: resolve(
      values.get("occupations") ?? "data/curated/occupations.json",
    ),
    outputPath: resolve(
      values.get("output") ?? "data/curated/sepe-occupation-catalogue.json",
    ),
  };
}

async function runCli(argv: readonly string[]): Promise<void> {
  const args = cliArguments(argv);
  const links = JSON.parse(await readFile(args.linksPath, "utf8")) as unknown;
  const occupations = JSON.parse(
    await readFile(args.occupationsPath, "utf8"),
  ) as unknown;
  if (!Array.isArray(links) || !Array.isArray(occupations)) {
    throw new Error("SEPE catalogue inputs must be JSON arrays.");
  }
  const catalogue = buildSepeOccupationCatalogue(
    links as TrainingOccupationLink[],
    occupations as Occupation[],
  );
  await writeFile(
    args.outputPath,
    `${JSON.stringify(catalogue, null, 2)}\n`,
    "utf8",
  );
}

const invokedPath = process.argv[1];
if (
  invokedPath !== undefined &&
  pathToFileURL(resolve(invokedPath)).href === import.meta.url
) {
  await runCli(process.argv.slice(2));
}
