import fs from "node:fs";
import path from "node:path";

import {
  loadAndValidateContestClaims,
  validateContestClaims,
} from "./validateContestClaims";
import {
  CONTEST_FREEZE_SOURCE_PATHS,
  loadAndValidateContestFreeze,
  type ContestFreeze,
} from "./validateContestFreeze";
import {
  validateContestReleaseEvidenceFromRoot,
  type ContestCandidatePlan,
} from "./validateContestReleaseEvidence";

export type ContestSubmissionDocuments = {
  "application-summary.md": string;
  "technical-evidence.md": string;
  "limitations.md": string;
  "submission-checklist.md": string;
};

export type ContestDeploymentEvidence = {
  method?: "manual-vps";
  status: "pending" | "verified";
  commitSha: string | null;
  workflowRunId: string | null;
  verifiedAt: string | null;
  captureProductCommitSha: string | null;
  captureCount: number | null;
  capturesAreCurrent: boolean;
  releaseGatesVerified?: boolean;
  releaseTag?: string | null;
  versionJsonUrl?: string | null;
  versionJsonCommitSha?: string | null;
  versionJsonSchemaVersion?: string | null;
  versionJsonVerifiedAt?: string | null;
  candidatePlan?: ContestCandidatePlan;
};

const PENDING_DEPLOYMENT_EVIDENCE: ContestDeploymentEvidence = {
  status: "pending",
  commitSha: null,
  workflowRunId: null,
  verifiedAt: null,
  captureProductCommitSha: null,
  captureCount: null,
  capturesAreCurrent: false,
  releaseGatesVerified: false,
  releaseTag: null,
  versionJsonUrl: null,
  versionJsonCommitSha: null,
  versionJsonSchemaVersion: null,
  versionJsonVerifiedAt: null,
};

const DOCUMENT_NAMES = [
  "application-summary.md",
  "technical-evidence.md",
  "limitations.md",
  "submission-checklist.md",
] as const;
const OUTPUT_DIRECTORY = path.join("docs", "contest");
const ROOT_URL = "https://salida-cyl.157-90-22-40.sslip.io/";
const FALLBACK_URL = "https://huntsman1756.github.io/concursos_cyl/";
const CONTEST_URL =
  "https://datosabiertos.jcyl.es/web/es/concurso-datos-abiertos/concurso-datos-abiertos.html";
const REGISTRATION_URL =
  "https://www.tramitacastillayleon.jcyl.es/web/jcyl/AdministracionElectronica/es/Plantilla100Detalle/1251181050732/Premio/1285664800452/Propuesta";

function list(values: readonly string[]): string {
  return values.join(", ");
}

function renderTemporalReleaseStatus(
  candidatePlan: ContestCandidatePlan | undefined,
): string {
  if (candidatePlan === undefined) return "";
  return `## Estado temporal de la candidatura

- Baseline funcional verificada: commit \`${candidatePlan.baseline.commitSha}\`, release funcional de referencia \`${candidatePlan.baseline.releaseTag}\`.
- Pages y VPS de la baseline: verificados con ese SHA; \`version.json\`: verificado y coincidente.
- A4 de la baseline: ${candidatePlan.baseline.captureCount}/${candidatePlan.baseline.captureCount} capturas PASS.
- Rama documental actual: \`${candidatePlan.documentaryBranch}\`.
- HEAD documental de referencia antes de esta corrección: \`${candidatePlan.documentaryBaseHeadSha}\`.
- Release candidata final: **PENDIENTE**.
- Nombre previsto: \`${candidatePlan.finalCandidate.releaseTag}\`.
- SHA final: **PENDIENTE HASTA EL MERGE**.
- Pages/VPS finales: **PENDIENTES**.
- \`version.json\` final: **PENDIENTE**.
- A4 final sobre ese SHA: **PENDIENTE**.`;
}

function renderFinalCandidateChecklist(
  candidatePlan: ContestCandidatePlan | undefined,
): string {
  if (candidatePlan === undefined) return "";
  return `## Release candidata final posterior al merge

- [ ] Verificar Pages/VPS finales sobre el SHA real del merge.
- [ ] Verificar \`version.json\` final tras la publicación de candidate.3.
- [ ] Ejecutar A4 final sobre el SHA real de candidate.3.`;
}

function spanishInteger(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/gu, ".");
}

function resourceRows(freeze: ContestFreeze): string {
  return Object.entries(freeze.manifest.resourceSnapshots)
    .map(
      ([key, resource]) =>
        `| ${key} | \`${resource.resourcePath}\` | ${resource.recordCount} | \`${resource.sha256}\` |`,
    )
    .join("\n");
}

function renderApplicationSummary(freeze: ContestFreeze): string {
  const { coverage, offers } = freeze;
  const deferredPrograms =
    coverage.deferredProgramCount === 0
      ? "ninguno"
      : list(coverage.deferredPrograms);
  return `# SALIDA CyL

## Convocatoria

Candidatura al [X Concurso de Datos Abiertos de Castilla y León](${CONTEST_URL}), categoría **Productos y Servicios**. El expediente recoge el **21 de septiembre de 2026** como fecha de cierre, pendiente de comprobación final en el formulario oficial y la presentación se realiza mediante la [sede electrónica](${REGISTRATION_URL}).

## Problema y audiencia

SALIDA CyL ayuda a personas de Castilla y León a explorar opciones de formación profesional y sus relaciones ocupacionales revisadas con fuentes identificadas. La aplicación reúne una consulta formativa, una exploración de ofertas relacionadas y una comparación separada de referencias oficiales de ingresos de titulados.

## Solución

La interfaz permite elegir directamente cualquiera de los ${freeze.manifest.resourceSnapshots.programs.recordCount} ciclos de FP o filtrar los ${freeze.manifest.resourceSnapshots.officialOccupations.recordCount} grupos primarios de la CNO-11. Expone por separado el catálogo oficial completo y la cobertura parcial de relaciones FP–ocupación revisadas, incluidas las relaciones con ofertas, las revisadas sin coincidencias y las todavía no validadas. La metodología explica el origen de cada dato y los límites de interpretación.

SALIDA CyL conecta FP y ocupación en ambos sentidos con evidencia verificable. Integra ocho datasets del Portal de Datos Abiertos de la Junta de Castilla y León, todos visibles en la ficha o en las rutas de apoyo.

El grafo revisado se devuelve a la comunidad como dataset derivado descargable en JSON y CSV, con licencia abierta, fuente por relación e integridad SHA-256 verificable.

## Cobertura congelada

- Instantánea publicada: \`${freeze.manifest.snapshotId}\`.
- Grupos primarios CNO-11 consultables: **${freeze.manifest.resourceSnapshots.officialOccupations.recordCount}**.
- **${coverage.distinctQualificationCount} cualificaciones distintas**.
- Claves de modalidad públicas: **${coverage.modalityKeyCount}** (${list(coverage.modalityKeys)}).
- Relaciones ocupacionales aprobadas: **${coverage.approvedRelationCount}**.
- Alias aprobados: **${coverage.approvedAliasCount}**.
- **${offers.matchedOfferCount} de las ${spanishInteger(freeze.manifest.resourceSnapshots.jobOffers.recordCount)} ofertas de la instantánea** quedan alcanzadas por relaciones publicadas (unión de IDs).
- Relaciones revisadas sin oferta alcanzada: **${coverage.zeroReviewedRelationCount}**.
- Programas diferidos por evidencia insuficiente: ${deferredPrograms}.

Las claves de modalidad se informan aparte de las identidades de cualificación. Una relación revisada sin coincidencia no se convierte en una afirmación sobre la ausencia de oportunidades; un programa diferido permanece fuera de las afirmaciones revisadas.

## Acceso

URL raíz para la candidatura: [${ROOT_URL}](${ROOT_URL})

Datos derivados: [${ROOT_URL}datos-abiertos](${ROOT_URL}datos-abiertos)

La memoria ordenada por criterios está en [jury-memo.md](jury-memo.md). La procedencia técnica, los límites estadísticos, las pruebas y los campos que requieren confirmación humana están en [technical-evidence.md](technical-evidence.md), [limitations.md](limitations.md) y [submission-checklist.md](submission-checklist.md).
`;
}

function renderTechnicalEvidence(
  freeze: ContestFreeze,
  deployment: ContestDeploymentEvidence,
): string {
  const { coverage, offers, attempts } = freeze;
  const candidatePlan = deployment.candidatePlan;
  const deploymentCommit =
    deployment.status === "verified" && deployment.commitSha !== null
      ? `\`${deployment.commitSha}\``
      : "**PENDIENTE DE DESPLIEGUE Y VERIFICACIÓN**";
  const workflowRun =
    deployment.method === "manual-vps"
      ? "No aplica: despliegue manual VPS; véase [evidencia C15](release-c15.md)"
      : deployment.status === "verified" && deployment.workflowRunId !== null
        ? `\`${deployment.workflowRunId}\``
        : "**PENDIENTE DE DESPLIEGUE Y VERIFICACIÓN**";
  const deploymentNote =
    deployment.method === "manual-vps"
      ? `La publicación manual VPS del commit ${deploymentCommit} se verificó el ${deployment.verifiedAt}. Véase [release-c15.md](release-c15.md).`
      : deployment.status === "verified" && deployment.verifiedAt !== null
        ? candidatePlan === undefined
          ? `El release público se verificó con el commit ${deploymentCommit} y el método de publicación ${workflowRun} el ${deployment.verifiedAt}.`
          : `La baseline funcional publicada se verificó con el commit ${deploymentCommit} y el método de publicación ${workflowRun} el ${deployment.verifiedAt}.`
        : "Estos dos campos no se inventan antes de ejecutar y verificar el release.";
  const reproducibilityIntro =
    (deployment.releaseGatesVerified ?? deployment.status === "verified")
      ? "Comandos ejecutados y ligados al commit de publicación en `release-evidence.json`:"
      : "Catálogo de comandos de reproducción; no es una transcripción de una ejecución completa. Los comandos y resultados efectivamente ejecutados sobre C15 están diferenciados en [release-c15.md](release-c15.md). La captura de datos se ejecuta aparte; para reproducir C15 se usa su instantánea congelada:";
  const releaseTraceability =
    deployment.releaseTag === null || deployment.releaseTag === undefined
      ? ""
      : `\n- ${candidatePlan === undefined ? "Release" : "Release funcional de referencia"}: \`${deployment.releaseTag}\`.`;
  const versionJsonTraceability =
    deployment.versionJsonUrl === null ||
    deployment.versionJsonUrl === undefined ||
    deployment.versionJsonCommitSha === null ||
    deployment.versionJsonCommitSha === undefined
      ? ""
      : `\n- \`version.json\` observado: [respuesta pública](${deployment.versionJsonUrl}) con commit \`${deployment.versionJsonCommitSha}\`.`;
  return `# Evidencia técnica

## Freeze de cobertura

<!-- prettier-ignore -->
| Campo | Valor |
| --- | --- |
| Commit fuente | \`${freeze.sourceCommitSha}\` |
| Manifest | \`${freeze.manifest.path}\` |
| SHA-256 del manifest | \`${freeze.manifest.sha256}\` |
| Generado | ${freeze.manifest.generatedAt} |
| Snapshot | \`${freeze.manifest.snapshotId}\` |
| Estado de calidad | ${freeze.manifest.qualityStatus} |
| Centros | ${freeze.manifest.qualityCounts.centers} |
| Programas | ${freeze.manifest.qualityCounts.programs} |
| Ofertas formativas | ${freeze.manifest.qualityCounts.offerings} |
| Ofertas laborales | ${freeze.manifest.qualityCounts.offers} |

### Recursos inmutables del snapshot

<!-- prettier-ignore -->
| Recurso | Ruta | Registros | SHA-256 |
| --- | --- | ---: | --- |
${resourceRows(freeze)}

## Recomputación de cobertura

- ${coverage.distinctQualificationCount} cualificaciones distintas: \`${list(coverage.distinctQualificationKeys)}\`.
- ${coverage.modalityKeyCount} claves de modalidad: \`${list(coverage.modalityKeys)}\`.
- ${coverage.approvedRelationCount} relaciones aprobadas y ${coverage.approvedAliasCount} alias aprobados.
- ${coverage.matchedProgramCount} programas con coincidencias y ${coverage.zeroReviewedProgramCount} programas revisados sin coincidencias.
- ${coverage.matchedRelationCount} relaciones alcanzadas y ${coverage.zeroReviewedRelationCount} relaciones revisadas sin oferta alcanzada.
- Unión de coincidencias: ${offers.matchedOfferCount} IDs; delta marginal de la ampliación: ${offers.marginalOfferDeltas.unionOfferCount} IDs.
- Intentos terminales: ${attempts.completed} completado, ${attempts.deferred} diferidos, ${attempts.discarded} descartados; ${attempts.reserveUnattempted} reservas no intentadas.

La cifra de ofertas es una unión de IDs de ofertas que pasan las reglas de matching con los datos publicados. No es un recuento de todo el mercado ni una proyección.

## Reproducibilidad

${reproducibilityIntro}

\`\`\`text
npm test -- --run
npm run test:e2e -- --workers=2
npm run lint
npm run build
npm run license:check
npm run format:check
npm run analysis:aliases:validate
npm run analysis:aliases:report:check
npm run analysis:pilot:validate
npm run analysis:pilot:report:check
npm exec -- tsx scripts/release/validateContestFreeze.ts
\`\`\`

La validación estructural comprueba el manifest, sus ${Object.keys(freeze.manifest.resourceSnapshots).length} recursos, los conjuntos de relaciones y la ausencia de cambios en las rutas de frontera congelada (${CONTEST_FREEZE_SOURCE_PATHS.map((sourcePath) => `\`${sourcePath}\``).join(", ")}) desde el commit fuente. Las rutas de UI, búsqueda y print quedan fuera de esta frontera y no se presentan como parte del freeze.

## ${candidatePlan === undefined ? "Despliegue" : "Baseline funcional verificada"}

- URL raíz esperada: [${ROOT_URL}](${ROOT_URL})
- ${candidatePlan === undefined ? "Commit desplegado" : "Commit de baseline desplegado"}: ${deploymentCommit}.
- Run del workflow: ${workflowRun}.
${releaseTraceability}${versionJsonTraceability}

${deploymentNote}

${deployment.method === "manual-vps" ? "## Evidencia pública C15 y pendientes\n\nC15 está publicado y verificado. [Release C15](release-c15.md) conserva los resultados reales y capturas públicas. El inventario A4 anterior es histórico. El estado pendiente del gate conjunto no equivale a ausencia de despliegue. NVDA y el piloto real siguen pendientes. No se ha enviado la candidatura." : ""}

${renderTemporalReleaseStatus(candidatePlan)}
`;
}

function renderLimitations(
  freeze: ContestFreeze,
  deployment: ContestDeploymentEvidence,
): string {
  const candidatePlan = deployment.candidatePlan;
  const deferredCoverage =
    freeze.coverage.deferredProgramCount === 0
      ? "No hay programas diferidos en esta instantánea."
      : `Los programas diferidos (${list(freeze.coverage.deferredPrograms)}) no se presentan como cobertura revisada.`;
  const releaseStatus =
    deployment.status === "verified" && deployment.commitSha !== null
      ? candidatePlan === undefined
        ? `El despliegue público está verificado para el commit \`${deployment.commitSha}\`; la verificación de rutas y recursos queda registrada en \`docs/contest/release-evidence.json\`.`
        : `La baseline funcional está verificada para el commit \`${deployment.commitSha}\`; la release candidata final posterior al merge permanece pendiente y la verificación de rutas y recursos queda registrada en \`docs/contest/release-evidence.json\`.`
      : "El despliegue y la verificación pública aún están pendientes y no forman parte de este documento como hechos consumados.";
  const visualVerificationStatus = deployment.capturesAreCurrent
    ? "La accesibilidad automatizada, el responsive y la semántica se comprobaron de nuevo durante la captura final."
    : "La accesibilidad, el responsive y la semántica se deben confirmar de nuevo en la sesión de capturas finales.";
  return `# Limitaciones y alcance

## Datos de FP y empleo

La publicación trabaja con un snapshot direccionado por manifest. Las cifras describen los registros publicados por las fuentes oficiales en esa captura; una relación revisada sin coincidencias no se interpreta como ausencia del mercado laboral.

Las relaciones formación–ocupación se publican solo cuando la evidencia oficial y la revisión del catálogo sostienen el vínculo exacto. ${deferredCoverage} Los alias son formas auditadas del catálogo, no ampliaciones automáticas por similitud.

## Ingresos de titulados

EDUCAbase proporciona referencias de bases de cotización de poblaciones administrativas con el alcance declarado por cada tabla. La aplicación mantiene separadas las referencias nacionales por ciclo o grupo y las referencias territoriales por comunidad del centro de titulación. No fabrica un cruce que la fuente no publica y no transforma una medida agregada en un resultado individual.

La representatividad de las tablas nacionales es la declarada por el Ministerio: algunas etiquetas agrupan ciclos y algunas titulaciones no aparecen. Los periodos no observados y los valores no disponibles se mantienen como tales. La ubicación territorial corresponde al centro donde se obtuvo la titulación, no al lugar de residencia o de trabajo posterior.

## Producto y release

Las rutas internas son recorridos de producto; la candidatura usa únicamente la raíz pública. La experiencia no requiere cuentas y no conserva selecciones, búsquedas, respuestas ni resultados. No guarda preferencias en almacenamiento local. Los filtros y términos presentes en la URL pueden quedar en el historial del navegador. ${visualVerificationStatus}

El objetivo de ampliar la cobertura está condicionado a evidencia: el freeze actual registra ${freeze.coverage.distinctQualificationCount} cualificaciones distintas y deja ${freeze.coverage.deferredProgramCount} programas diferidos. ${releaseStatus}

${deployment.method === "manual-vps" ? "## Evidencia pública C15 y pendientes\n\nC15 está publicado y verificado. [Release C15](release-c15.md) conserva los resultados reales y capturas públicas. El inventario A4 anterior es histórico. El estado pendiente del gate conjunto no equivale a ausencia de despliegue. NVDA y el piloto real siguen pendientes. No se ha enviado la candidatura." : ""}

${renderTemporalReleaseStatus(candidatePlan)}
`;
}

function renderSubmissionChecklist(
  freeze: ContestFreeze,
  deployment: ContestDeploymentEvidence,
): string {
  const candidatePlan = deployment.candidatePlan;
  const deploymentCommit =
    deployment.status === "verified" && deployment.commitSha !== null
      ? `\`${deployment.commitSha}\``
      : "**PENDIENTE DE DESPLIEGUE Y VERIFICACIÓN**";
  const workflowRun =
    deployment.method === "manual-vps"
      ? "No aplica: despliegue manual VPS; véase [evidencia C15](release-c15.md)"
      : deployment.status === "verified" && deployment.workflowRunId !== null
        ? `\`${deployment.workflowRunId}\``
        : "**PENDIENTE DE DESPLIEGUE Y VERIFICACIÓN**";
  const releaseGate =
    (deployment.releaseGatesVerified ?? deployment.status === "verified")
      ? "- [x] Ejecutar los gates de release y verificar la aplicación pública."
      : "- [ ] Cerrar el gate documental conjunto; comprobar el alcance de pruebas ya ejecutadas en la evidencia de la release.";
  const deploymentGate =
    deployment.status === "verified"
      ? "- [x] Registrar el commit publicado y su método de despliegue con datos observados."
      : "- [ ] Rellenar el commit desplegado y el run del workflow con datos observados.";
  const releaseTraceability =
    deployment.releaseTag === null || deployment.releaseTag === undefined
      ? ""
      : `- ${candidatePlan === undefined ? "Release" : "Release funcional de referencia"}: \`${deployment.releaseTag}\`.\n`;
  const versionJsonTraceability =
    deployment.versionJsonUrl === null ||
    deployment.versionJsonUrl === undefined ||
    deployment.versionJsonCommitSha === null ||
    deployment.versionJsonCommitSha === undefined
      ? ""
      : `- \`version.json\` verificado: [respuesta pública](${deployment.versionJsonUrl}) con commit igual a \`${deployment.versionJsonCommitSha}\`.\n`;
  const captureInventoryLine = deployment.capturesAreCurrent
    ? candidatePlan === undefined
      ? "el manifiesto contiene capturas actuales ligadas al commit de publicación."
      : "el manifiesto contiene las capturas actuales de la baseline, ligadas a su commit de publicación."
    : "las 13 capturas existentes son históricas.";
  const automatedCaptureGate =
    deployment.method === "manual-vps"
      ? "- [x] Incorporar las capturas públicas y el registro de comprobación C15; el inventario A4 anterior se conserva como histórico."
      : deployment.capturesAreCurrent && deployment.captureCount !== null
        ? `- [x] Captura automatizada A4${candidatePlan === undefined ? "" : " de la baseline"}: ${deployment.captureCount}/${deployment.captureCount} capturas actuales recapturadas y validadas en \`docs/contest/evidence-capture.json\`.`
        : "- [ ] Captura automatizada A4: pendiente de recaptura y validación.";
  const publicReviewLabel =
    candidatePlan === undefined
      ? "release actual"
      : "baseline funcional observada";

  let visualEvidenceLine: string;
  let capturesReviewGate: string;
  let figuresConfirmationGate: string;
  if (deployment.status === "pending") {
    visualEvidenceLine =
      "El inventario A4 conserva 13 capturas históricas; se conserva como archivo. Para C15, consultar las capturas públicas y su alcance en [release-c15.md](release-c15.md).";
    capturesReviewGate =
      "- [ ] Revisar las capturas en contexto anónimo, sin datos personales ni credenciales.";
    figuresConfirmationGate =
      "- [ ] Confirmar que las cifras visibles siguen coincidiendo con `" +
      freeze.manifest.snapshotId +
      "`. (evidencia visual pendiente)";
  } else if (deployment.capturesAreCurrent) {
    visualEvidenceLine =
      "**capturada y validada en `docs/contest/evidence-capture.json`**.";
    capturesReviewGate =
      "- [ ] Revisar las capturas en contexto anónimo, sin datos personales ni credenciales. (capturas actuales; revisión humana pendiente)";
    figuresConfirmationGate =
      "- [ ] Confirmar que las cifras visibles siguen coincidiendo con `" +
      freeze.manifest.snapshotId +
      "`. (revisión humana pendiente)";
  } else if (
    deployment.captureProductCommitSha === null &&
    deployment.captureCount === 0
  ) {
    visualEvidenceLine =
      "El inventario A4 conserva 13 capturas históricas; se conserva como archivo. Para C15, consultar las capturas públicas y su alcance en [release-c15.md](release-c15.md).";
    capturesReviewGate =
      "- [ ] Revisar las capturas en contexto anónimo, sin datos personales ni credenciales.";
    figuresConfirmationGate =
      "- [ ] Confirmar que las cifras visibles siguen coincidiendo con `" +
      freeze.manifest.snapshotId +
      "`. (evidencia visual pendiente)";
  } else {
    const captureLabel =
      deployment.captureCount !== null
        ? `las ${deployment.captureCount} capturas son`
        : "las capturas son";
    if (deployment.captureProductCommitSha !== null) {
      visualEvidenceLine =
        captureLabel +
        " **históricas** (`captureProductCommitSha " +
        deployment.captureProductCommitSha +
        "`; " +
        "commit desplegado " +
        deploymentCommit +
        "). La recaptura del commit desplegado está pendiente.";
    } else {
      visualEvidenceLine =
        captureLabel +
        " **históricas** respecto al commit desplegado; " +
        "la recaptura del commit desplegado está pendiente.";
    }
    capturesReviewGate =
      "- [ ] Revisar las capturas en contexto anónimo, sin datos personales ni credenciales. " +
      "(capturas históricas — recaptura pendiente)";
    figuresConfirmationGate =
      "- [ ] Confirmar que las cifras visibles siguen coincidiendo con `" +
      freeze.manifest.snapshotId +
      "`. (capturas históricas — recaptura pendiente)";
  }

  const finalCandidateChecklist =
    candidatePlan === undefined
      ? ""
      : `\n\n${renderFinalCandidateChecklist(candidatePlan)}`;

  return `# Checklist de presentación

## Campos que debe completar una persona

- Convocatoria: [X Concurso de Datos Abiertos de Castilla y León](${CONTEST_URL}).
- Categoría: **Productos y Servicios**; primer premio: **2.500 €**.
- Plazo recogido en el expediente: **del 22 de julio al 21 de septiembre de 2026**; confirmar en la sede antes del envío. Véase [estado administrativo](closing-status.md).
- Presentación: [sede electrónica](${REGISTRATION_URL}).
- Identidad de la persona solicitante: **PENDIENTE — no consta en el repositorio**.
- Contacto: **PENDIENTE — no consta en el repositorio**.
- Declaraciones, consentimiento y adjuntos exigidos: **PENDIENTE — revisar en el portal**.

## ${candidatePlan === undefined ? "Campos técnicos" : "Baseline funcional verificada"}

- URL raíz a presentar: [${ROOT_URL}](${ROOT_URL})
- URL histórica de fallback (C15 no verificada allí): [${FALLBACK_URL}](${FALLBACK_URL})
- Commit fuente del freeze: \`${freeze.sourceCommitSha}\`.
- Snapshot: \`${freeze.manifest.snapshotId}\`.
- ${candidatePlan === undefined ? "Commit desplegado" : "Commit de baseline desplegado"}: ${deploymentCommit}.
- Run del workflow: ${workflowRun}.
${releaseTraceability}${versionJsonTraceability}- Evidencia visual: ${visualEvidenceLine}

${deployment.method === "manual-vps" ? "## Evidencia pública C15 y pendientes\n\nC15 está publicado y verificado. [Release C15](release-c15.md) conserva los resultados reales y capturas públicas. El inventario A4 anterior es histórico. El estado pendiente del gate conjunto no equivale a ausencia de despliegue. NVDA y el piloto real siguen pendientes. No se ha enviado la candidatura." : ""}

${renderTemporalReleaseStatus(candidatePlan)}

## Evidencia visual y gate final

${automatedCaptureGate}
- [ ] Completar la revisión humana de accesibilidad; NVDA aplazado a petición del titular. No se declara conformidad WCAG.
${deployment.method === "manual-vps" ? "- [x] Comprobar automáticamente las rutas públicas de FP, ocupación y comparador; alcance y límites en release-c15.md." : `- [ ] Revisar la aplicación pública de la ${publicReviewLabel} en contexto anónimo, incluyendo las rutas de FP, ocupación y comparador.`}
${deployment.method === "manual-vps" ? "- [x] Separar capturas públicas C15 del inventario histórico; falta inspección humana final de la selección." : `- [ ] Conservar solo capturas actuales, sin datos personales ni credenciales; ${captureInventoryLine}`}
${releaseGate}
${deploymentGate}
${capturesReviewGate}
${deployment.method === "manual-vps" ? "- [ ] Confirmar humanamente las cifras de las capturas elegidas antes de la entrega; los hashes públicos ya están verificados." : figuresConfirmationGate}
- [ ] Obtener aprobación humana explícita para la solicitud externa.${finalCandidateChecklist}

**PENDIENTE DE APROBACIÓN HUMANA:** este repositorio no envía la solicitud al concurso ni decide los campos de identidad, contacto, declaraciones o consentimiento.

Los cambios de producto requieren validación sobre un SHA exacto y verificación del despliegue elegido. Una actualización documental no modifica por sí sola la versión pública.
`;
}

export function renderContestSubmission(
  freeze: ContestFreeze,
  deployment: ContestDeploymentEvidence = PENDING_DEPLOYMENT_EVIDENCE,
): ContestSubmissionDocuments {
  const normalizeDocument = (content: string): string =>
    `${content.replace(/\n{3,}/gu, "\n\n").replace(/\n+$/u, "")}\n`;

  return {
    "application-summary.md": normalizeDocument(
      renderApplicationSummary(freeze),
    ),
    "technical-evidence.md": normalizeDocument(
      renderTechnicalEvidence(freeze, deployment),
    ),
    "limitations.md": normalizeDocument(renderLimitations(freeze, deployment)),
    "submission-checklist.md": normalizeDocument(
      renderSubmissionChecklist(freeze, deployment),
    ),
  };
}

function loadContestDeploymentEvidence(
  rootDir: string,
  freeze: ContestFreeze,
): ContestDeploymentEvidence {
  const strictEvidence = validateContestReleaseEvidenceFromRoot(rootDir);
  const releaseEvidencePath = path.join(
    rootDir,
    "docs",
    "contest",
    "release-evidence.json",
  );
  if (!fs.existsSync(releaseEvidencePath)) {
    return PENDING_DEPLOYMENT_EVIDENCE;
  }

  const parsed = JSON.parse(fs.readFileSync(releaseEvidencePath, "utf8")) as {
    deployment?: Partial<ContestDeploymentEvidence>;
    captureProductCommitSha?: string;
    candidatePlan?: ContestCandidatePlan;
    manifest?: { snapshotId?: unknown };
    localGates?: {
      evidenceManifest?: { captureCount?: unknown };
    };
  };
  const deployment = parsed.deployment;
  if (
    deployment === undefined ||
    (deployment.status !== "pending" && deployment.status !== "verified")
  ) {
    throw new Error("release-evidence.json has an invalid deployment record");
  }

  // Read captureCount from localGates.evidenceManifest.captureCount
  let captureCount: number | null = null;
  const rawCaptureCount = parsed.localGates?.evidenceManifest?.captureCount;
  if (rawCaptureCount !== undefined && rawCaptureCount !== null) {
    if (
      typeof rawCaptureCount === "number" &&
      Number.isInteger(rawCaptureCount) &&
      rawCaptureCount >= 0
    ) {
      captureCount = rawCaptureCount;
    } else {
      throw new Error(
        "localGates.evidenceManifest.captureCount must be a non-negative integer",
      );
    }
  }

  const captureProductCommitSha = parsed.captureProductCommitSha ?? null;
  if (captureProductCommitSha !== null) {
    if (!/^[a-f0-9]{40}$/u.test(captureProductCommitSha)) {
      throw new Error(
        "captureProductCommitSha must be a 40-character hex SHA when present",
      );
    }
  }

  const deploymentCommit = deployment.commitSha ?? null;
  const deploymentMatchesFreeze =
    parsed.manifest?.snapshotId === freeze.manifest.snapshotId;
  const effectiveStatus =
    deployment.status === "verified" && deploymentMatchesFreeze
      ? "verified"
      : "pending";
  const capturesAreCurrent =
    effectiveStatus === "verified" &&
    deploymentCommit !== null &&
    captureProductCommitSha !== null &&
    deploymentCommit === captureProductCommitSha;
  const evidence: ContestDeploymentEvidence = {
    status: effectiveStatus,
    method: deployment.method,
    commitSha: deploymentCommit,
    workflowRunId: deployment.workflowRunId ?? null,
    verifiedAt: deployment.verifiedAt ?? null,
    captureProductCommitSha,
    captureCount,
    capturesAreCurrent,
    releaseGatesVerified: strictEvidence.status === "verified",
    releaseTag: deployment.releaseTag ?? null,
    versionJsonUrl: deployment.versionJsonUrl ?? null,
    versionJsonCommitSha: deployment.versionJsonCommitSha ?? null,
    versionJsonSchemaVersion: deployment.versionJsonSchemaVersion ?? null,
    versionJsonVerifiedAt: deployment.versionJsonVerifiedAt ?? null,
    candidatePlan: parsed.candidatePlan,
  };
  if (
    evidence.status === "verified" &&
    (evidence.commitSha === null ||
      !/^[a-f0-9]{40}$/u.test(evidence.commitSha) ||
      (evidence.workflowRunId === null && evidence.method !== "manual-vps") ||
      evidence.verifiedAt === null)
  ) {
    throw new Error("verified deployment evidence is incomplete");
  }
  return evidence;
}

export function validateRenderedContestSubmission(
  documents: ContestSubmissionDocuments,
  rootDir = process.cwd(),
): void {
  const keys = Object.keys(documents);
  if (JSON.stringify(keys) !== JSON.stringify(DOCUMENT_NAMES)) {
    throw new Error("submission renderer returned an unexpected document set");
  }
  for (const name of DOCUMENT_NAMES) {
    const content = documents[name];
    if (!content.endsWith("\n") || content.includes("\r")) {
      throw new Error(`${name} must use LF and end with one newline`);
    }
  }
  const claims = loadAndValidateContestClaims(
    path.join(rootDir, "docs", "contest", "claim-ledger.json"),
  );
  validateContestClaims(claims, {
    documents: DOCUMENT_NAMES.map((name) => ({
      path: name,
      text: documents[name],
    })),
  });
}

export function loadAndRenderContestSubmission(
  rootDir = process.cwd(),
): ContestSubmissionDocuments {
  const freeze = loadAndValidateContestFreeze(rootDir);
  const deployment = loadContestDeploymentEvidence(rootDir, freeze);
  const documents = renderContestSubmission(freeze, deployment);
  validateRenderedContestSubmission(documents, rootDir);
  return documents;
}

function writeDocuments(
  rootDir: string,
  documents: ContestSubmissionDocuments,
): void {
  for (const name of DOCUMENT_NAMES) {
    fs.writeFileSync(
      path.join(rootDir, OUTPUT_DIRECTORY, name),
      documents[name],
      "utf8",
    );
  }
}

function checkDocuments(
  rootDir: string,
  documents: ContestSubmissionDocuments,
): void {
  for (const name of DOCUMENT_NAMES) {
    const target = path.join(rootDir, OUTPUT_DIRECTORY, name);
    if (!fs.existsSync(target)) {
      throw new Error(`${name} is missing; run with --write first`);
    }
    const current = fs.readFileSync(target, "utf8");
    if (current !== documents[name]) {
      throw new Error(`${name} is stale; rerun with --write`);
    }
  }
}

if (
  path.resolve(process.argv[1] ?? "") === path.resolve(import.meta.filename)
) {
  const rootDir = process.cwd();
  const documents = loadAndRenderContestSubmission(rootDir);
  if (process.argv.includes("--write")) {
    writeDocuments(rootDir, documents);
    console.info(
      "Contest submission documents rendered from the coverage freeze.",
    );
  } else {
    checkDocuments(rootDir, documents);
    console.info("Contest submission documents match the coverage freeze.");
  }
}
