import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { E2E_BROWSERS, type E2EBrowser } from "./playwrightProjects";

const PLAYWRIGHT_CLI = resolve("node_modules/playwright/cli.js");

export type PlaywrightRunnerOptions = {
  install: boolean;
  browsers: E2EBrowser[];
  playwrightArgs: string[];
};

function isE2EBrowser(value: string): value is E2EBrowser {
  return E2E_BROWSERS.includes(value as E2EBrowser);
}

export function parsePlaywrightRunnerArgs(
  args: readonly string[],
): PlaywrightRunnerOptions {
  const browsers: E2EBrowser[] = [];
  const playwrightArgs: string[] = [];
  let install = false;

  for (const arg of args) {
    if (arg === "--install") {
      install = true;
    } else if (isE2EBrowser(arg)) {
      browsers.push(arg);
    } else {
      playwrightArgs.push(arg);
    }
  }

  return {
    install,
    browsers: browsers.length > 0 ? [...new Set(browsers)] : ["chromium"],
    playwrightArgs,
  };
}

function runPlaywrightCommand(
  args: readonly string[],
  env: NodeJS.ProcessEnv = process.env,
): number {
  const result = spawnSync(process.execPath, [PLAYWRIGHT_CLI, ...args], {
    cwd: process.cwd(),
    env,
    stdio: "inherit",
  });

  if (result.error) {
    console.error(`Could not start Playwright: ${result.error.message}`);
    return 1;
  }

  return result.status ?? 1;
}

export function executePlaywright(options: PlaywrightRunnerOptions): number {
  if (options.install) {
    const installArgs = [
      "install",
      ...(process.platform === "linux" ? ["--with-deps"] : []),
      ...options.browsers,
    ];
    const installExitCode = runPlaywrightCommand(installArgs);
    if (installExitCode !== 0) return installExitCode;
  }

  return runPlaywrightCommand(["test", ...options.playwrightArgs], {
    ...process.env,
    PLAYWRIGHT_BROWSERS: options.browsers.join(","),
  });
}

export function main(args: readonly string[] = process.argv.slice(2)): number {
  return executePlaywright(parsePlaywrightRunnerArgs(args));
}

const entryPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (entryPath === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
