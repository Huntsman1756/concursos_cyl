/// <reference types="node" />

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const productionModules = [
  "src/features/occupation-first/OccupationCombobox.tsx",
  "src/features/occupation-first/OccupationSearchPage.tsx",
  "src/features/occupation-first/OccupationResultsPage.tsx",
  "src/features/occupation-first/TrainingRouteCard.tsx",
  "src/domain/occupation.ts",
] as const;

const forbiddenRuntimePatterns = [
  /\bfrom\s+["'](?:openai|@ai-sdk\/[^"']+|@anthropic-ai\/[^"']+|cohere-ai|@google\/generative-ai)["']/u,
  /\bimport\s*\(\s*["'](?:openai|@ai-sdk\/[^"']+|@anthropic-ai\/[^"']+|cohere-ai|@google\/generative-ai)["']\s*\)/u,
  /https:\/\/(?:api\.openai\.com|api\.anthropic\.com|generativelanguage\.googleapis\.com)\b/u,
  /\b(?:localStorage|sessionStorage)\b/u,
  /\bdocument\.cookie\s*=/u,
  /\b(?:navigator\.)?sendBeacon\s*\(/u,
] as const;

describe("occupation-first runtime boundaries", () => {
  it("contains no AI provider integration or browser persistence writes", () => {
    for (const modulePath of productionModules) {
      const source = readFileSync(resolve(process.cwd(), modulePath), "utf8");
      for (const pattern of forbiddenRuntimePatterns) {
        expect(source, `${modulePath} matched ${pattern.source}`).not.toMatch(
          pattern,
        );
      }
    }
  });
});
