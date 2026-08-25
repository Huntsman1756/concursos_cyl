import { describe, expect, it } from "vitest";
import { buildGoogleMapsSearchUrl } from "./mapsUrl";

describe("buildGoogleMapsSearchUrl", () => {
  it("encodes non-empty location parts into a Google Maps search URL", () => {
    expect(
      buildGoogleMapsSearchUrl([
        " IES ALONSO DE MADRIGAL ",
        "",
        "Ávila",
        "Castilla y León",
      ]),
    ).toBe(
      "https://www.google.com/maps/search/?api=1&query=IES%20ALONSO%20DE%20MADRIGAL%2C%20%C3%81vila%2C%20Castilla%20y%20Le%C3%B3n",
    );
  });

  it("returns null when no location part contains text", () => {
    expect(buildGoogleMapsSearchUrl(["", "   ", "\t"])).toBeNull();
  });
});
