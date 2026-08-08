import eocReview from "../../analysis/fp_official_alias_pass/EOC01M.json";
import { describe, expect, it } from "vitest";

import {
  loadAliasPassValidationContext,
  validateProgramOfficialAliasReview,
} from "./validateFpOfficialAliasPass";

describe("EOC01M official alias audit", () => {
  it("records but does not publish EOC01M one-word official terms", async () => {
    const context = await loadAliasPassValidationContext(process.cwd());

    expect(() =>
      validateProgramOfficialAliasReview(eocReview, context),
    ).not.toThrow();
    expect(eocReview.programKey).toBe("EOC01M");
    expect(eocReview.reviews).toHaveLength(26);
    expect(
      new Set(eocReview.reviews.map(({ occupationId }) => occupationId)),
    ).toEqual(
      new Set([
        "occupation:cno11:7111",
        "occupation:cno11:7121",
        "occupation:cno11:7193",
        "occupation:cno11:7240",
        "occupation:cno11:7291",
      ]),
    );
    for (const alias of ["Encofradores", "Tejadores", "Albañiles"]) {
      expect(eocReview.reviews).toContainEqual(
        expect.objectContaining({
          alias,
          disposition: "rejected",
          reasonCode: "matcher_policy_one_word",
        }),
      );
    }
    expect(
      eocReview.reviews
        .filter(({ disposition }) => disposition === "accepted")
        .map(({ alias, occupationId, acceptedProgramOutputRelevance }) => ({
          alias,
          occupationId,
          acceptedProgramOutputRelevance,
        })),
    ).toEqual([
      {
        alias: "Pavimentadores a base de hormigón",
        occupationId: "occupation:cno11:7111",
        acceptedProgramOutputRelevance: {
          relationship: "singular_plural_variant",
          outputTerm: "Pavimentador",
          aliasTerm: "Pavimentadores",
        },
      },
      {
        alias: "Instaladores de sistemas de impermeabilización en edificios",
        occupationId: "occupation:cno11:7193",
        acceptedProgramOutputRelevance: {
          relationship: "singular_plural_variant",
          outputTerm: "Instalador",
          aliasTerm: "Instaladores",
        },
      },
      {
        alias: "Instaladores de materiales de impermeabilización en edificios",
        occupationId: "occupation:cno11:7193",
        acceptedProgramOutputRelevance: {
          relationship: "singular_plural_variant",
          outputTerm: "Instalador",
          aliasTerm: "Instaladores",
        },
      },
      {
        alias: "Impermeabilizadores de terrazas",
        occupationId: "occupation:cno11:7193",
        acceptedProgramOutputRelevance: {
          relationship: "singular_plural_variant",
          outputTerm: "Impermeabilizador",
          aliasTerm: "Impermeabilizadores",
        },
      },
      {
        alias: "Pavimentadores con adoquines",
        occupationId: "occupation:cno11:7240",
        acceptedProgramOutputRelevance: {
          relationship: "singular_plural_variant",
          outputTerm: "Pavimentador",
          aliasTerm: "Pavimentadores",
        },
      },
    ]);
    expect(
      eocReview.reviews
        .filter(({ sourceQuote }) => /(?:^|, )\d{4}$/u.test(sourceQuote))
        .map(({ alias, reasonCode }) => ({ alias, reasonCode })),
    ).toEqual([
      {
        alias: "Operadores de máquinas en planta de hormigones",
        reasonCode: "semantic_broadening",
      },
      {
        alias: "Operadores de máquinas de asfaltado",
        reasonCode: "semantic_broadening",
      },
      {
        alias: "Ensambladores/montadores de prefabricados de hormigón",
        reasonCode: "semantic_broadening",
      },
      {
        alias: "Mantenedores de edificios",
        reasonCode: "semantic_broadening",
      },
    ]);
  });
});
