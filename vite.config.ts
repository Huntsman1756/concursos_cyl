import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { normalizePublicBasePath } from "./scripts/release/publicBasePath.ts";

const SECURITY_HEADERS = {
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
};

export default defineConfig({
  base: normalizePublicBasePath(process.env.VITE_PUBLIC_BASE_PATH),
  plugins: [react()],
  preview: { headers: SECURITY_HEADERS },
  test: {
    environment: "jsdom",
    exclude: [
      ...configDefaults.exclude,
      "tests/e2e/**",
      ".tmp/**",
      ".worktrees/**",
      "_codex_tmp/**",
      "_codex_worktrees/**",
    ],
    setupFiles: ["./src/test/setup.ts"],
  },
});
