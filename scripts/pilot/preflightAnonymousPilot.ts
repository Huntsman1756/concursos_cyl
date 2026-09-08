import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  ANONYMOUS_PILOT_RELEASE as target,
  ANONYMOUS_PILOT_NOT_RUN,
} from "./anonymousPilotSchema";
const fetchJson = async (path: string) => {
  const response = await fetch(new URL(path, target.rootUrl), {
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
  if (
    !response.ok ||
    !response.headers.get("content-type")?.includes("application/json")
  )
    throw new Error(`Pilot preflight: invalid JSON response for ${path}`);
  return response.json();
};
const [version, manifest] = await Promise.all([
  fetchJson("version.json"),
  fetchJson("data/v1/manifest.json"),
]);
if (
  version.commit !== target.deployedCommitSha ||
  manifest.snapshotId !== target.snapshotId
)
  throw new Error(
    "Pilot preflight: published release does not match release-target.json; do not start or mix sessions.",
  );
const hashes: Record<string, string> = {};
for (const name of ["anonymous-protocol.md", "anonymous-task-script.md"])
  hashes[name] = createHash("sha256")
    .update(await readFile(`docs/pilot/${name}`))
    .digest("hex");
console.log(
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      status: ANONYMOUS_PILOT_NOT_RUN,
      technicalPreflight: "passed",
      target,
      protocolHashes: hashes,
      humanSessionsExecuted: false,
    },
    null,
    2,
  ),
);
