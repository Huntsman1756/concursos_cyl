import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  summarizeFpCoveragePilotResults,
  type FpCoveragePilotResults,
  validateFpCoveragePilotResultsFile,
} from "./validateFpCoveragePilot";

function oneDecimal(value: number): string {
  return value.toFixed(1);
}

/** Renders the checked-in report from validated machine-readable pilot inputs. */
export function renderFpCoveragePilotReport(
  results: FpCoveragePilotResults,
): string {
  const summary = summarizeFpCoveragePilotResults(results);
  const completed = summary.terminalCounts.completed;
  const lowerHours = summary.wallClockMinutes.lower / 60;
  const upperHours = summary.wallClockMinutes.upper / 60;
  const activeOffersPerHour =
    summary.marginalOffersReached / (summary.modeledActiveWorkMinutes / 60);
  const lowerWallOffersPerHour = summary.marginalOffersReached / upperHours;
  const upperWallOffersPerHour = summary.marginalOffersReached / lowerHours;

  return `# Resultados del piloto de cobertura FP

## Resultado observado

- ${completed}/5 programas completados; ${summary.terminalCounts.deferred}/5 diferido; ${summary.terminalCounts.discarded}/5 descartado.
- ${summary.modeledActiveWorkMinutes} minutos de trabajo activo modelado en los cinco intentos. Es una suma declarada de investigación, implementación, pruebas y revisión; no representa minutos literales de revisión independiente ni todo el tiempo de los bucles de corrección.
- El intervalo de reloj de extremo a extremo es ${oneDecimal(summary.wallClockMinutes.lower)}–${oneDecimal(summary.wallClockMinutes.upper)} minutos (${oneDecimal(lowerHours)}–${oneDecimal(upperHours)} horas). Para cada intento empieza en \`startedAt\`, su límite inferior de terminación es la marca Git del commit final revisado y su límite superior es el inicio del siguiente intento (o la agregación para COM01M). Las cinco marcas Git están validadas contra los SHA guardados.
- Coste por programa completado: ${oneDecimal(summary.modeledActiveWorkMinutes / completed)} minutos activos modelados; ${oneDecimal(summary.wallClockMinutes.lower / completed)}–${oneDecimal(summary.wallClockMinutes.upper / completed)} minutos de reloj. Las magnitudes de reloj son rangos, no minutos de revisión inventados.
- ${summary.marginalOffersReached} ofertas marginales alcanzadas. La tasa es ${oneDecimal(activeOffersPerHour)} ofertas/hora activa modelada y ${oneDecimal(lowerWallOffersPerHour)}–${oneDecimal(upperWallOffersPerHour)} ofertas/hora de reloj.

No se infiere una tasa estable para todo el catálogo a partir de cinco intentos.

## Cobertura publicada y límites

La cobertura revisada pública incluye las dos claves oficiales de entrega de Desarrollo de Aplicaciones Web (IFC03S e IFC03SD) y SAN21, HOT01M, SSC01M y EOC01M. La interfaz la deriva de \`mapping-coverage.json\` direccionado por el manifiesto; no mantiene una lista paralela. COM01M permanece diferido y se muestra como cobertura no disponible, sin relación, alias, ocupación ni afirmación pública revisada.

SAN21 es el único ciclo del piloto con alcance marginal en la instantánea: 43 ofertas mediante la unión de relaciones aceptadas. HOT01M, SSC01M y EOC01M tienen relaciones oficiales aprobadas, pero 0 ofertas marginales cada uno porque no se admitieron alias sin evidencia oficial suficiente. Cero no equivale a ausencia de empleo fuera de la instantánea.

## No finalización y siguiente tramo

COM01M se difiere: las salidas de ventas, comercio, almacén, logística y atención remota no tienen una correspondencia primaria, exacta y de cuatro dígitos con CNO-11; ampliar por similitud sería especulativo.

El siguiente trabajo recomendado no es abrir más ciclos de forma ciega. Primero, una pasada acotada de evidencia oficial de alias para HOT01M, SSC01M y EOC01M, manteniendo el cierre por defecto, puede resolver el cuello de botella medido de tres ciclos completos sin ofertas alcanzadas. Solo después, y si esa pasada sigue sin admitir alias, se deben priorizar nuevos ciclos de mayor demanda con el mismo contrato de evidencia.
`;
}

async function checkRenderedReport(): Promise<void> {
  const results = await validateFpCoveragePilotResultsFile();
  const expected = renderFpCoveragePilotReport(results);
  const reportPath = resolve(
    process.cwd(),
    "analysis",
    "fp_coverage_pilot_results.md",
  );
  const actual = (await readFile(reportPath, "utf8")).replace(/\r\n/gu, "\n");
  if (actual !== expected) {
    throw new Error(
      "FP coverage pilot report is not the validated rendered output.",
    );
  }
}

const invokedPath = process.argv[1];
if (
  invokedPath !== undefined &&
  pathToFileURL(resolve(invokedPath)).href === import.meta.url
) {
  try {
    await checkRenderedReport();
    console.info("FP coverage pilot report matches validated inputs.");
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
