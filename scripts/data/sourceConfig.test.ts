import { describe, expect, it } from "vitest";

import { SOURCE_CONFIG } from "./sourceConfig";

describe("SOURCE_CONFIG", () => {
  it("requests the education center directory in a stable order", () => {
    const url = new URL(SOURCE_CONFIG.educationCenterDirectory.recordsUrl);

    expect(
      url.pathname.endsWith("/datasets/directorio-de-centros-docentes/records"),
    ).toBe(true);
    expect(url.searchParams.get("order_by")).toBe("codigo");
  });

  it("requests municipalities in stable INE-code order", () => {
    const url = new URL(SOURCE_CONFIG.municipalities.recordsUrl);

    expect(url.searchParams.get("order_by")).toBe("cod_ine");
  });
});
