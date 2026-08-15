import { existsSync } from "node:fs";
import { join } from "node:path";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

interface VersionMetadata {
  schemaVersion: string;
  commit: string;
}

async function writeVersionMetadata(
  distPath: string,
  commit: string,
): Promise<void> {
  const commitRegex = /^[0-9a-f]{40}$/;
  if (!commitRegex.test(commit)) {
    throw new Error(`Invalid commit SHA format: ${commit}`);
  }

  if (!existsSync(distPath)) {
    throw new Error(`Target directory does not exist: ${distPath}`);
  }

  const filePath = join(distPath, "version.json");
  const metadata: VersionMetadata = {
    schemaVersion: "1.0.0",
    commit: commit,
  };
  const content = JSON.stringify(metadata, null, 2) + "\n";

  const fs = await import("node:fs");
  fs.writeFileSync(filePath, content, "utf-8");
  console.log(`Version metadata written to ${filePath}`);
}

// (D) Correctly detect CLI on Windows using pathToFileURL
const isMainModule =
  import.meta.url === pathToFileURL(resolve(process.argv[1])).toString();

if (isMainModule) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage: tsx writeVersionMetadata.ts <distPath> <commit>");
    process.exit(1);
  }
  writeVersionMetadata(args[0], args[1]).catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}

export { writeVersionMetadata };
