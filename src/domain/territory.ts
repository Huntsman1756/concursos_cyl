export const CYL_PROVINCES = [
  "Ávila",
  "Burgos",
  "León",
  "Palencia",
  "Salamanca",
  "Segovia",
  "Soria",
  "Valladolid",
  "Zamora",
] as const;

export type CylProvince = (typeof CYL_PROVINCES)[number];

export function parseCylProvince(
  values: readonly string[],
):
  | { kind: "none" }
  | { kind: "valid"; province: CylProvince }
  | { kind: "invalid" } {
  if (values.length === 0) return { kind: "none" };
  if (values.length !== 1) return { kind: "invalid" };

  const value = values[0];
  if (value !== undefined && CYL_PROVINCES.includes(value as CylProvince)) {
    return { kind: "valid", province: value as CylProvince };
  }
  return { kind: "invalid" };
}
