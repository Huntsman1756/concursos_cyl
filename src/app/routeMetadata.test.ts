import { afterEach, describe, expect, it } from "vitest";
import { routeMetadata, updateRouteMetadata } from "./routeMetadata";
afterEach(() => {
  document.head.innerHTML = "";
});
describe("route metadata", () => {
  it("keeps distinct training canonicals without query terms or fragments", () => {
    const a = routeMetadata("/desde-fp/SAN21/", "?query=private-term");
    expect(a.canonical).toBe(
      "https://salida-cyl.157-90-22-40.sslip.io/desde-fp/SAN21",
    );
    expect(a.canonical).not.toBe(routeMetadata("/").canonical);
    expect(a.robots).toBe("noindex,follow");
    expect(JSON.stringify(a)).not.toContain("private-term");
  });
  it("updates navigation metadata without duplicate tags or a stale noindex", () => {
    updateRouteMetadata("/desde-oferta", "?query=private-term");
    updateRouteMetadata("/metodologia");
    expect(
      document.head.querySelectorAll('link[rel="canonical"]'),
    ).toHaveLength(1);
    expect(
      document.head.querySelectorAll('meta[name="description"]'),
    ).toHaveLength(1);
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute(
      "content",
      "index,follow",
    );
    expect(document.title).toBe("Metodología · SALIDA CyL");
    expect(document.head.innerHTML).not.toContain("private-term");
  });
});
