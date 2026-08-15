import { verifyCaddyContainer } from "./verifyCaddyContainer";

const baseUrl = process.env.CADDY_SMOKE_BASE_URL;
const expectedCommit = process.env.CADDY_SMOKE_EXPECTED_COMMIT;

if (baseUrl === undefined) {
  throw new Error("CADDY_SMOKE_BASE_URL is required.");
}

await verifyCaddyContainer(baseUrl, fetch, expectedCommit);
console.log(
  `Verified Caddy container at ${baseUrl}${expectedCommit ? ` with commit ${expectedCommit}` : ""}.`,
);
