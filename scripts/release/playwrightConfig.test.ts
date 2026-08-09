import { expect, it } from "vitest";

import playwrightConfig from "../../playwright.config";

it("starts the Playwright web server without local helper dependencies", () => {
  expect(playwrightConfig.webServer).toMatchObject({
    command: "npm run build && npm run preview -- --host 127.0.0.1 --port 4173",
  });
});
