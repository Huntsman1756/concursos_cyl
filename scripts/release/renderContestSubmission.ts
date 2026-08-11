import fs from "node:fs";
import path from "node:path";

import {
  loadAndValidateContestClaims,
  validateContestClaims,
} from "./validateContestClaims";
import {
  loadAndValidateContestFreeze,
  type ContestFreeze,
} from "./validateContestFreeze";

export type ContestSubmissionDocuments = {
  "application-summary.md": string;
  "technical-evidence.md": string;
  "limitations.md": string;
  "submission-checklist.md": string;
};

export type ContestDeploymentEvidence = {
  status: "pending" | "verified";
  commitSha: string | null;
  workflowRunId: string | null;
  verifiedAt: string | null;
};

const PENDING_DEPLOYMENT_EVIDENCE: ContestDeploymentEvidence = {
  status: "pending",
  commitSha: null,
  workflowRunId: null,
  verifiedAt: null,
};

const DOCUMENT_NAMES = [
  "application-summary.md",
  "technical-evidence.md",
  "limitations.md",
  "submission-checklist.md",
] as const;
const OUTPUT_DIRECTORY = path.join("docs", "contest");
const ROOT_URL = "https://huntsman1756.github.io/concursos_cyl/";

function list(values: readonly string[]): string {
  return values.join(", ");
}

function spanishInteger(value: number): string {
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 }).format(
    value,
  );
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
  return `# SALIDA CyL

## Problema y audiencia

SALIDA CyL ayuda a personas de Castilla y León a explorar opciones de formación profesional y sus relaciones ocupacionales revisadas con fuentes identificadas. La aplicación reúne una consulta formativa, una exploración de ofertas relacionadas y una comparación separada de referencias oficiales de ingresos de titulados.

## Solución

La interfaz permite entrar desde el catálogo de FP o desde una ocupación. Expone estados diferenciados para relaciones revisadas con ofertas, relaciones revisadas sin coincidencias y programas cuya revisión sigue diferida. La metodología explica el origen de cada dato y los límites de interpretación.

## Cobertura congelada

- Instantánea publicada: \`${freeze.manifest.snapshotId}\`.
- **${coverage.distinctQualificationCount} cualificaciones distintas**.
- Claves de modalidad públicas: **${coverage.modalityKeyCount}** (${list(coverage.modalityKeys)}).
- Relaciones ocupacionales aprobadas: **${coverage.approvedRelationCount}**.
- Alias aprobados: **${coverage.approvedAliasCount}**.
- **${offers.matchedOfferCount} de las ${spanishInteger(freeze.manifest.resourceSnapshots.jobOffers.recordCount)} ofertas de la instantánea** quedan alcanzadas por relaciones publicadas (unión de IDs).
- Relaciones revisadas sin oferta alcanzada: **${coverage.zeroReviewedRelationCount}**.
- Programas diferidos por evidencia insuficiente: ${list(coverage.deferredPrograms)}.

Las claves de modalidad se informan aparte de las identidades de cualificación. Una relación revisada sin coincidencia no se convierte en una afirmación sobre la ausencia de oportunidades; un programa diferido permanece fuera de las afirmaciones revisadas.

## Acceso

URL raíz para la candidatura: [${ROOT_URL}](${ROOT_URL})

La procedencia técnica, los límites estadísticos, las pruebas y los campos que requieren confirmación humana están en [technical-evidence.md](technical-evidence.md), [limitations.md](limitations.md) y [submission-checklist.md](submission-checklist.md).
`;
}

function renderTechnicalEvidence(
  freeze: ContestFreeze,
  deployment: ContestDeploymentEvidence,
): string {
  const { coverage, offers, attempts } = freeze;
  const deploymentCommit =
    deployment.status === "verified" && deployment.commitSha !== null
      ? `\`${deployment.commitSha}\``
      : "**PENDIENTE DE DESPLIEGUE Y VERIFICACIÓN**";
  const workflowRun =
    deployment.status === "verified" && deployment.workflowRunId !== null
      ? `\`${deployment.workflowRunId}\``
      : "**PENDIENTE DE DESPLIEGUE Y VERIFICACIÓN**";
  const deploymentNote =
    deployment.status === "verified" && deployment.verifiedAt !== null
      ? `El release público se verificó con el commit ${deploymentCommit} y el run ${workflowRun} el ${deployment.verifiedAt}.`
      : "Estos dos campos no se inventan antes de ejecutar y verificar el release.";
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

Comandos ejecutados sobre el commit congelado:

\`\`\`text
npm run data:build
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

La revisión independiente confirmó el manifest, los diez recursos, los conjuntos de relaciones y la ausencia de cambios en \`data/curated\`, \`public/data\`, \`src/domain\` y \`src/features\` desde el commit fuente.

## Despliegue

- URL raíz esperada: [${ROOT_URL}](${ROOT_URL})
- Commit desplegado: ${deploymentCommit}.
- Run del workflow: ${workflowRun}.

${deploymentNote}
`;
}

function renderLimitations(
  freeze: ContestFreeze,
  deployment: ContestDeploymentEvidence,
): string {
  const releaseStatus =
    deployment.status === "verified" && deployment.commitSha !== null
      ? `El despliegue público está verificado para el commit \`${deployment.commitSha}\`; la verificación de rutas y recursos queda registrada en \`docs/contest/release-evidence.json\`.`
      : "El despliegue y la verificación pública aún están pendientes y no forman parte de este documento como hechos consumados.";
  return `# Limitaciones y alcance

## Datos de FP y empleo

La publicación trabaja con un snapshot direccionado por manifest. Las cifras describen los registros publicados por las fuentes oficiales en esa captura; una relación revisada sin coincidencias no se interpreta como ausencia del mercado laboral.

Las relaciones formación–ocupación se publican solo cuando la evidencia oficial y la revisión del catálogo sostienen el vínculo exacto. Los programas diferidos (${list(freeze.coverage.deferredPrograms)}) no se presentan como cobertura revisada. Los alias son formas auditadas del catálogo, no ampliaciones automáticas por similitud.

## Ingresos de titulados

EDUCAbase proporciona referencias de bases de cotización de poblaciones administrativas con el alcance declarado por cada tabla. La aplicación mantiene separadas las referencias nacionales por ciclo o grupo y las referencias territoriales por comunidad del centro de titulación. No fabrica un cruce que la fuente no publica y no transforma una medida agregada en un resultado individual.

La representatividad de las tablas nacionales es la declarada por el Ministerio: algunas etiquetas agrupan ciclos y algunas titulaciones no aparecen. Los periodos no observados y los valores no disponibles se mantienen como tales. La ubicación territorial corresponde al centro donde se obtuvo la titulación, no al lugar de residencia o de trabajo posterior.

## Producto y release

Las rutas internas son recorridos de producto; la candidatura usa únicamente la raíz pública. La experiencia no requiere cuentas ni persistencia del navegador. La accesibilidad, el responsive y la semántica se deben confirmar de nuevo en la sesión de capturas finales.

El objetivo de ampliar la cobertura está condicionado a evidencia: el freeze actual registra ${freeze.coverage.distinctQualificationCount} cualificaciones distintas y deja ${freeze.coverage.deferredProgramCount} programas diferidos. ${releaseStatus}
`;
}

function renderSubmissionChecklist(
  freeze: ContestFreeze,
  deployment: ContestDeploymentEvidence,
): string {
  const deploymentCommit =
    deployment.status === "verified" && deployment.commitSha !== null
      ? `\`${deployment.commitSha}\``
      : "**PENDIENTE DE DESPLIEGUE Y VERIFICACIÓN**";
  const workflowRun =
    deployment.status === "verified" && deployment.workflowRunId !== null
      ? `\`${deployment.workflowRunId}\``
      : "**PENDIENTE DE DESPLIEGUE Y VERIFICACIÓN**";
  const releaseGate =
    deployment.status === "verified"
      ? "- [x] Ejecutar los gates de release y verificar la aplicación pública."
      : "- [ ] Ejecutar los gates de release y verificar la aplicación pública.";
  const deploymentGate =
    deployment.status === "verified"
      ? "- [x] Rellenar el commit desplegado y el run del workflow con datos observados."
      : "- [ ] Rellenar el commit desplegado y el run del workflow con datos observados.";
  return `# Checklist de presentación

## Campos que debe completar una persona

- Título oficial del concurso: **PENDIENTE — confirmar manualmente**.
- Categoría: **PENDIENTE — confirmar manualmente**.
- Identidad de la persona solicitante: **PENDIENTE — no consta en el repositorio**.
- Contacto: **PENDIENTE — no consta en el repositorio**.
- Declaraciones, consentimiento y adjuntos exigidos: **PENDIENTE — revisar en el portal**.

## Campos técnicos

- URL raíz a presentar: [${ROOT_URL}](${ROOT_URL})
- Commit fuente del freeze: \`${freeze.sourceCommitSha}\`.
- Snapshot: \`${freeze.manifest.snapshotId}\`.
- Commit desplegado: ${deploymentCommit}.
- Run del workflow: ${workflowRun}.
- Evidencia visual: **capturada y validada en \`docs/contest/evidence-capture.json\`**.

## Gate final

${releaseGate}
${deploymentGate}
- [x] Revisar las capturas en contexto anónimo, sin datos personales ni credenciales.
- [x] Confirmar que las cifras visibles siguen coincidiendo con \`${freeze.manifest.snapshotId}\`.
- [ ] Obtener aprobación humana explícita para la solicitud externa.

**PENDIENTE DE APROBACIÓN HUMANA:** este repositorio no envía la solicitud al concurso ni decide los campos de identidad, contacto, declaraciones o consentimiento.
`;
}

export function renderContestSubmission(
  freeze: ContestFreeze,
  deployment: ContestDeploymentEvidence = PENDING_DEPLOYMENT_EVIDENCE,
): ContestSubmissionDocuments {
  return {
    "application-summary.md": renderApplicationSummary(freeze),
    "technical-evidence.md": renderTechnicalEvidence(freeze, deployment),
    "limitations.md": renderLimitations(freeze, deployment),
    "submission-checklist.md": renderSubmissionChecklist(freeze, deployment),
  };
}

function loadContestDeploymentEvidence(
  rootDir: string,
): ContestDeploymentEvidence {
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
  };
  const deployment = parsed.deployment;
  if (
    deployment === undefined ||
    (deployment.status !== "pending" && deployment.status !== "verified")
  ) {
    throw new Error("release-evidence.json has an invalid deployment record");
  }
  const evidence: ContestDeploymentEvidence = {
    status: deployment.status,
    commitSha: deployment.commitSha ?? null,
    workflowRunId: deployment.workflowRunId ?? null,
    verifiedAt: deployment.verifiedAt ?? null,
  };
  if (
    evidence.status === "verified" &&
    (evidence.commitSha === null ||
      !/^[a-f0-9]{40}$/u.test(evidence.commitSha) ||
      evidence.workflowRunId === null ||
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
  const deployment = loadContestDeploymentEvidence(rootDir);
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
