function segment(value: string): string {
  return encodeURIComponent(value);
}

export type SearchValue = string | null | undefined;

export function withSearch(
  pathname: string,
  values: Record<string, SearchValue>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null && value.trim() !== "") {
      params.set(key, value.trim());
    }
  }
  const search = params.toString();
  return search.length === 0 ? pathname : `${pathname}?${search}`;
}

export function homePath(): string {
  return "/";
}

export function trainingSearchPath(query?: string): string {
  return withSearch("/desde-fp", { query });
}

export function trainingDetailPath(
  programKey: string,
  query?: string,
  province?: string,
): string {
  return withSearch(`/desde-fp/${segment(programKey)}`, { query, province });
}

export function trainingOffersPath(
  programKey: string,
  values: Record<string, SearchValue> = {},
): string {
  return withSearch(`/desde-fp/${segment(programKey)}/ofertas`, values);
}

export function occupationSearchPath(query?: string): string {
  return withSearch("/desde-ocupacion", { query });
}

export function occupationDetailPath(
  occupationId: string,
  query?: string,
): string {
  return withSearch(`/desde-ocupacion/${segment(occupationId)}`, { query });
}

export function occupationOffersPath(
  occupationId: string,
  values: Record<string, SearchValue> = {},
): string {
  return withSearch(
    `/desde-ocupacion/${segment(occupationId)}/ofertas`,
    values,
  );
}

export function globalOffersPath(
  values: Record<string, SearchValue> = {},
): string {
  return withSearch("/desde-oferta", values);
}

export function globalCentersPath(
  values: Record<string, SearchValue> = {},
): string {
  return withSearch("/donde-estudiar", values);
}

export function contextualCentersPath(programKey: string): string {
  return `/formacion/${segment(programKey)}`;
}

export function methodPath(): string {
  return "/metodologia";
}
