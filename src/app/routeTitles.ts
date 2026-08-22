const APP_NAME = "SALIDA CyL";

function withAppName(title: string): string {
  return `${title} · ${APP_NAME}`;
}

export function titleForPathname(pathname: string): string {
  const normalizedPath = pathname.replace(/\/+$/u, "") || "/";

  if (normalizedPath === "/") return withAppName("Inicio");
  if (normalizedPath === "/desde-fp") return withAppName("Desde FP");
  if (normalizedPath.startsWith("/desde-fp/"))
    return withAppName("Resultados desde FP");
  if (normalizedPath.startsWith("/formacion/"))
    return withAppName("Dónde estudiar");
  if (normalizedPath === "/desde-ocupacion")
    return withAppName("Desde ocupación");
  if (normalizedPath.startsWith("/desde-ocupacion/"))
    return withAppName("Resultados desde ocupación");
  if (normalizedPath === "/comparar") return withAppName("Comparar estudios");
  if (normalizedPath === "/recursos") return withAppName("Más formación");
  if (normalizedPath === "/datos-abiertos")
    return withAppName("Datos abiertos");
  if (normalizedPath === "/accesibilidad") return withAppName("Accesibilidad");
  if (normalizedPath === "/para-organizaciones")
    return withAppName("Para organizaciones");
  if (normalizedPath === "/metodologia")
    return withAppName("Metodología y fuentes");
  return withAppName("Página no encontrada");
}
