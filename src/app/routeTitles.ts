const APP_NAME = "SALIDA CyL";

function withAppName(title: string): string {
  return `${title} · ${APP_NAME}`;
}

export function titleForPathname(pathname: string): string {
  const normalizedPath = pathname.replace(/\/+$/u, "") || "/";

  if (normalizedPath === "/") return withAppName("Inicio");
  if (normalizedPath === "/desde-fp") return withAppName("Explorar FP");
  if (normalizedPath.includes("/ofertas"))
    return withAppName("Ofertas relacionadas");
  if (normalizedPath.startsWith("/desde-fp/"))
    return withAppName("Ficha de FP");
  if (
    normalizedPath === "/donde-estudiar" ||
    normalizedPath.startsWith("/donde-estudiar/") ||
    normalizedPath.startsWith("/formacion/")
  )
    return withAppName("Dónde estudiar");
  if (normalizedPath === "/desde-ocupacion")
    return withAppName("Buscar ocupación");
  if (normalizedPath.startsWith("/desde-ocupacion/"))
    return withAppName("Ficha de profesión");
  if (normalizedPath === "/desde-oferta")
    return withAppName("Ofertas de empleo");
  if (normalizedPath === "/comparar") return withAppName("Comparar ingresos");
  if (normalizedPath === "/recursos")
    return withAppName("Formación complementaria");
  if (normalizedPath === "/datos-abiertos")
    return withAppName("Datos abiertos");
  if (normalizedPath === "/accesibilidad") return withAppName("Accesibilidad");
  if (normalizedPath === "/para-organizaciones")
    return withAppName("Para organizaciones");
  if (normalizedPath === "/metodologia") return withAppName("Método y límites");
  return withAppName("Página no encontrada");
}
