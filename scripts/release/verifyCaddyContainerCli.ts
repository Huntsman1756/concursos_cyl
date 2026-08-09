import { verifyCaddyContainer } from "./verifyCaddyContainer";

const baseUrl = process.env.CADDY_SMOKE_BASE_URL;
if (baseUrl === undefined) {
  throw new Error("CADDY_SMOKE_BASE_URL is required.");
}
await verifyCaddyContainer(baseUrl);
console.log(`Verified Caddy container at ${baseUrl}.`);
