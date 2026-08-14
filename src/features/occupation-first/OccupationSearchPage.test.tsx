import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type {
  Occupation,
  OccupationAlias,
} from "../../../data/schemas/curatedMappings";
import { OccupationSearchPage } from "./OccupationSearchPage";

const occupation: Occupation = {
  occupationId: "occupation:web-development",
  preferredLabel: "Desarrollador web",
  description: "Diseña y mantiene aplicaciones web públicas.",
};
const aliases: OccupationAlias[] = [
  {
    occupationId: occupation.occupationId,
    alias: "programación web",
    reviewStatus: "approved",
    sourceUrl: "https://example.test/source",
    reviewedAt: "2026-08-14",
    mappingVersion: "1.0.0",
  },
];

describe("OccupationSearchPage", () => {
  it("requires confirmation of a controlled occupation", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <OccupationSearchPage occupations={[occupation]} aliases={aliases} />
      </MemoryRouter>,
    );
    await user.type(
      screen.getByRole("combobox", { name: /ocupación/i }),
      "programación web",
    );
    expect(
      screen.getByRole("option", { name: /programación web/i }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: /ver rutas/i })).toBeDisabled();
    await user.click(screen.getByRole("option", { name: /programación web/i }));
    expect(screen.getByRole("button", { name: /ver rutas/i })).toBeEnabled();
  });
});
