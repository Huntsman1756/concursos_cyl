import { configDefaults, defineConfig, mergeConfig } from "vitest/config";

import baseConfig from "./vite.config.ts";

const SUPERSEDED_EXPANSION_SUITES = [
  "scripts/analysis/fpSpecificEvidenceReview.test.ts",
  "scripts/analysis/measureFpMarginalAliasImpact.test.ts",
  "scripts/analysis/rankFpOfferAliasCandidates.test.ts",
  "scripts/analysis/renderFpCoverageExpansionReport.test.ts",
  "scripts/analysis/renderFpOfficialAliasPassReport.test.ts",
  "scripts/analysis/validateFpCoverageExpansion.*.test.ts",
  "scripts/analysis/validateFpCoveragePilot.test.ts",
  "scripts/analysis/validateFpMarginalAliasReview.test.ts",
  "scripts/analysis/validateFpOfficialAliasPass.test.ts",
  "scripts/analysis/validateFpOneWordPublicationReview.test.ts",
];

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      exclude: [
        ...configDefaults.exclude,
        "tests/e2e/**",
        ".tmp/**",
        ".worktrees/**",
        "_codex_tmp/**",
        "_codex_worktrees/**",
        ...SUPERSEDED_EXPANSION_SUITES,
      ],
    },
  }),
);
