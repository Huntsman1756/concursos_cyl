import { describe, expect, it } from "vitest";

import {
  buildOfficialOccupations,
  extractCnoPrimaryGroups,
} from "./extractBoeCnoOccupations";

const html = `
  <table>
    <tr><td><p>271</p></td><td>Analistas de software.</td></tr>
    <tr><td><p>2713</p></td><td><p>Analistas, programadores y diseñadores Web y multimedia.</p></td></tr>
    <tr><td>5110</td><td>Cocineros asalariados.</td></tr>
  </table>
`;

describe("BOE CNO-11 occupation extraction", () => {
  it("keeps only four-digit primary groups and strips presentation punctuation", () => {
    expect(extractCnoPrimaryGroups(html)).toEqual([
      {
        classificationCode: "2713",
        preferredLabel:
          "Analistas, programadores y diseñadores Web y multimedia",
      },
      {
        classificationCode: "5110",
        preferredLabel: "Cocineros asalariados",
      },
    ]);
  });

  it("preserves reviewed everyday confirmation labels without hiding official groups", () => {
    const occupations = buildOfficialOccupations(
      extractCnoPrimaryGroups(html),
      [
        {
          occupationId: "occupation:cno11:2713",
          preferredLabel:
            "Analistas, programadores y diseñadores web y multimedia",
          confirmationLabel: "Programación y desarrollo web",
          classificationSystem: "CNO-11",
          classificationCode: "2713",
          reviewStatus: "approved",
          sourceUrl: "https://www.ine.es/example",
          reviewedAt: "2026-08-04",
          catalogVersion: "1.0.0",
        },
      ],
      "2026-08-11",
    );

    expect(occupations).toHaveLength(2);
    expect(occupations[0]).toMatchObject({
      classificationCode: "2713",
      confirmationLabel: "Programación y desarrollo web",
      reviewStatus: "approved",
      catalogVersion: "2.0.0",
    });
    expect(occupations[1]).toMatchObject({
      classificationCode: "5110",
      confirmationLabel: "Cocineros asalariados",
      reviewStatus: "approved",
    });
  });
});
