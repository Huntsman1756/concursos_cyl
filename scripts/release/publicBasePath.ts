/** Accepts only a same-origin absolute pathname and returns one trailing slash. */
export function normalizePublicBasePath(value: string | undefined): string {
  const candidate = value?.trim() || "/";
  if (
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    candidate.includes("?") ||
    candidate.includes("#") ||
    /%[0-9a-f]{2}/iu.test(candidate) ||
    candidate.split("/").some((segment) => segment === "." || segment === "..")
  ) {
    throw new Error(
      `VITE_PUBLIC_BASE_PATH must be a same-origin absolute path: ${candidate}`,
    );
  }
  return candidate === "/" ? "/" : `${candidate.replace(/\/+$/u, "")}/`;
}
