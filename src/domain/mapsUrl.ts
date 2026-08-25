export function buildGoogleMapsSearchUrl(
  parts: readonly string[],
): string | null {
  const query = parts
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join(", ");
  return query.length > 0
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    : null;
}
