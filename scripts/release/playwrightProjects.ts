import type { Project } from "@playwright/test";

export const E2E_BROWSERS = ["chromium", "firefox", "webkit"] as const;
export type E2EBrowser = (typeof E2E_BROWSERS)[number];

type E2EProjectDefinition = {
  name: string;
  browserName: E2EBrowser;
  use: NonNullable<Project["use"]>;
};

export const DEFAULT_E2E_BROWSERS = ["chromium"] as const;

export const E2E_PROJECT_DEFINITIONS = [
  {
    name: "chromium-desktop",
    browserName: "chromium",
    use: {
      viewport: { width: 1280, height: 800 },
    },
  },
  {
    name: "chromium-mobile",
    browserName: "chromium",
    use: {
      hasTouch: true,
      isMobile: true,
      viewport: { width: 360, height: 800 },
    },
  },
  {
    name: "firefox-desktop",
    browserName: "firefox",
    use: {
      viewport: { width: 1280, height: 800 },
    },
  },
  {
    name: "webkit-desktop",
    browserName: "webkit",
    use: {
      viewport: { width: 1280, height: 800 },
    },
  },
] satisfies readonly E2EProjectDefinition[];

function isE2EBrowser(value: string): value is E2EBrowser {
  return E2E_BROWSERS.includes(value as E2EBrowser);
}

export function resolveE2EProjects(
  browserSelection = process.env.PLAYWRIGHT_BROWSERS,
): Array<Pick<Project, "name" | "use">> {
  const requestedBrowsers = browserSelection?.trim()
    ? browserSelection.split(",").map((browser) => browser.trim())
    : [...DEFAULT_E2E_BROWSERS];
  const uniqueBrowsers = [...new Set(requestedBrowsers)];
  const unsupportedBrowsers = uniqueBrowsers.filter(
    (browser) => !isE2EBrowser(browser),
  );

  if (unsupportedBrowsers.length > 0) {
    throw new Error(
      `Unsupported PLAYWRIGHT_BROWSERS value: ${unsupportedBrowsers.join(", ")}. ` +
        `Use only ${E2E_BROWSERS.join(", ")}.`,
    );
  }

  return E2E_PROJECT_DEFINITIONS.filter(({ browserName }) =>
    uniqueBrowsers.includes(browserName),
  ).map(({ name, browserName, use }) => ({
    name,
    use: { ...use, browserName },
  }));
}
