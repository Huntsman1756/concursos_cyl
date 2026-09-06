import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

import {
  loadAndValidateContestFreeze,
  type ContestFreeze,
} from "./validateContestFreeze";
import {
  renderContestSubmission,
  validateRenderedContestSubmission,
  type ContestDeploymentEvidence,
} from "./renderContestSubmission";

describe("contest submission renderer", () => {
  let freeze: ContestFreeze;

  beforeAll(() => {
    freeze = loadAndValidateContestFreeze();
  }, 30_000);

  it("renders the four final documents from the frozen values", () => {
    const rendered = renderContestSubmission(freeze);

    expect(Object.keys(rendered)).toEqual([
      "application-summary.md",
      "technical-evidence.md",
      "limitations.md",
      "submission-checklist.md",
    ]);
    expect(rendered["application-summary.md"]).toContain(
      freeze.manifest.snapshotId,
    );
    expect(rendered["application-summary.md"]).toContain(
      `${freeze.coverage.distinctQualificationCount} cualificaciones distintas`,
    );
    expect(rendered["application-summary.md"]).toContain(
      `${freeze.offers.matchedOfferCount} de las ${freeze.manifest.resourceSnapshots.jobOffers.recordCount.toLocaleString("es-ES", { useGrouping: "always" })} ofertas de la instantánea`,
    );
    expect(rendered["application-summary.md"]).toContain(
      "dataset derivado descargable en JSON y CSV",
    );
    expect(rendered["application-summary.md"]).toContain(
      "X Concurso de Datos Abiertos de Castilla y León",
    );
    expect(rendered["submission-checklist.md"]).toContain(
      "21 de septiembre de 2026",
    );
    expect(rendered["submission-checklist.md"]).toContain(
      "primer premio: **2.500 €**",
    );
    expect(rendered["submission-checklist.md"]).not.toContain(
      "sigue mostrando la IX edición",
    );
    expect(rendered["submission-checklist.md"]).toContain(
      "https://salida-cyl.157-90-22-40.sslip.io/",
    );
    expect(rendered["submission-checklist.md"]).toContain(
      "PENDIENTE DE APROBACIÓN HUMANA",
    );
    expect(rendered["technical-evidence.md"]).toContain(
      "no es una transcripción de una ejecución completa",
    );
    expect(rendered["technical-evidence.md"]).toContain(
      "rutas de UI, búsqueda y print quedan fuera de esta frontera",
    );
    expect(rendered["technical-evidence.md"]).not.toContain(
      "ausencia de cambios en `data/curated`, `public/data`, `src/domain` y `src/features`",
    );
    expect(rendered["technical-evidence.md"]).not.toContain(
      "Comandos ejecutados sobre el commit congelado",
    );
  });

  it("renders verified deployment provenance and current capture checks", () => {
    const deployment: ContestDeploymentEvidence = {
      status: "verified",
      commitSha: "5e4510ca230daaedf8e2a769d66781a2b319ef1b",
      workflowRunId: "31338739210",
      verifiedAt: "2026-08-09T22:21:22.5248634Z",
      captureProductCommitSha: "5e4510ca230daaedf8e2a769d66781a2b319ef1b",
      captureCount: 9,
      capturesAreCurrent: true,
    };
    const rendered = renderContestSubmission(freeze, deployment);

    expect(rendered["technical-evidence.md"]).toContain(
      "5e4510ca230daaedf8e2a769d66781a2b319ef1b",
    );
    expect(rendered["technical-evidence.md"]).toContain("31338739210");
    expect(rendered["technical-evidence.md"]).not.toContain(
      "PENDIENTE DE DESPLIEGUE Y VERIFICACIÓN",
    );
    expect(rendered["technical-evidence.md"]).toContain(
      "Comandos ejecutados y ligados al commit de publicación",
    );
    expect(rendered["submission-checklist.md"]).toContain(
      "- [x] Ejecutar los gates de release y verificar la aplicación pública.",
    );
    // Las capturas actuales siguen requiriendo inspección manual.
    expect(rendered["submission-checklist.md"]).toContain(
      "- [ ] Revisar las capturas en contexto anónimo, sin datos personales ni credenciales.",
    );
    expect(rendered["submission-checklist.md"]).toContain(
      "- [ ] Confirmar que las cifras visibles siguen coincidiendo",
    );
    expect(rendered["submission-checklist.md"]).toContain(
      "el manifiesto contiene capturas actuales ligadas al commit de publicación",
    );
    expect(rendered["submission-checklist.md"]).not.toContain(
      "las 13 capturas existentes son históricas",
    );
    expect(rendered["submission-checklist.md"]).toContain(
      "- [x] Captura automatizada A4: 9/9 capturas actuales recapturadas y validadas",
    );
  });

  it("distinguishes a manual public release from the incomplete final submission", () => {
    const rendered = renderContestSubmission(freeze, {
      status: "verified",
      method: "manual-vps",
      commitSha: "02d6805e5cb661f3289ade47ad2364b26fd346f8",
      workflowRunId: null,
      verifiedAt: "2026-09-06T09:09:34.881Z",
      captureProductCommitSha: null,
      captureCount: 0,
      capturesAreCurrent: false,
      releaseGatesVerified: false,
    });
    expect(rendered["technical-evidence.md"]).toContain(
      "No aplica: despliegue manual VPS",
    );
    expect(rendered["technical-evidence.md"]).not.toContain(
      "PENDIENTE DE DESPLIEGUE Y VERIFICACIÓN",
    );
    expect(rendered["submission-checklist.md"]).toContain(
      "NVDA y el piloto real siguen pendientes",
    );
    expect(rendered["submission-checklist.md"]).toContain(
      "No se ha enviado la candidatura",
    );
    expect(rendered["submission-checklist.md"]).not.toContain(
      "Mac desbloqueado",
    );
    expect(rendered["technical-evidence.md"]).not.toContain(
      "Comandos ejecutados y ligados",
    );
  });

  it("renders the verified baseline separately from the pending final candidate", () => {
    const deployment = {
      status: "verified",
      commitSha: "5e4510ca230daaedf8e2a769d66781a2b319ef1b",
      workflowRunId: "31338739210",
      verifiedAt: "2026-08-09T22:21:22.5248634Z",
      captureProductCommitSha: "5e4510ca230daaedf8e2a769d66781a2b319ef1b",
      captureCount: 13,
      capturesAreCurrent: true,
      candidatePlan: {
        baseline: {
          status: "verified",
          commitSha: "5e4510ca230daaedf8e2a769d66781a2b319ef1b",
          releaseTag: "v2026.08.25-candidate.2",
          pagesVpsStatus: "verified",
          versionJsonStatus: "verified",
          a4Status: "passed",
          captureCount: 13,
        },
        documentaryBranch: "codex/final-candidature-coherence-20260826",
        documentaryBaseHeadSha: "25fc0f89097e107eb47c49b0a848ba822bc4cea1",
        finalCandidate: {
          status: "pending",
          releaseTag: "v2026.08.26-candidate.3",
          commitSha: null,
          pagesVpsStatus: "pending",
          versionJsonStatus: "pending",
          a4Status: "pending",
        },
      },
    } as ContestDeploymentEvidence;
    const rendered = renderContestSubmission(freeze, deployment);

    for (const name of [
      "submission-checklist.md",
      "technical-evidence.md",
      "limitations.md",
    ] as const) {
      expect(rendered[name]).toContain("Baseline funcional verificada");
      expect(rendered[name]).toContain("v2026.08.25-candidate.2");
      expect(rendered[name]).toContain(
        "Release candidata final: **PENDIENTE**",
      );
      expect(rendered[name]).toContain(
        "Nombre previsto: `v2026.08.26-candidate.3`",
      );
      expect(rendered[name]).toContain(
        "SHA final: **PENDIENTE HASTA EL MERGE**",
      );
      expect(rendered[name]).toContain("Pages/VPS finales: **PENDIENTES**");
      expect(rendered[name]).toContain("`version.json` final: **PENDIENTE**");
      expect(rendered[name]).toContain("A4 final sobre ese SHA: **PENDIENTE**");
    }
    expect(rendered["submission-checklist.md"]).toContain(
      "Rama documental actual: `codex/final-candidature-coherence-20260826`",
    );
    expect(rendered["submission-checklist.md"]).toContain(
      "HEAD documental de referencia antes de esta corrección: `25fc0f89097e107eb47c49b0a848ba822bc4cea1`",
    );
    expect(rendered["submission-checklist.md"]).toContain(
      "- [ ] Verificar Pages/VPS finales sobre el SHA real del merge.",
    );
    expect(rendered["submission-checklist.md"]).toContain(
      "- [ ] Ejecutar A4 final sobre el SHA real de candidate.3.",
    );
    expect(rendered["submission-checklist.md"]).not.toContain(
      "Release candidata final: `v2026.08.25-candidate.2`",
    );
  });

  it("marks captures as historical and leaves review gates unchecked when captureProductCommitSha differs", () => {
    const deployment: ContestDeploymentEvidence = {
      status: "verified",
      commitSha: "f1aeb187ca243165efc63753840e5eb76db9ba4c",
      workflowRunId: "31546107126",
      verifiedAt: "2026-08-11T23:33:46Z",
      captureProductCommitSha: "f423a208a7f8c140a1dfa342e8689d3b6d967e94",
      captureCount: 9,
      capturesAreCurrent: false,
    };
    const rendered = renderContestSubmission(freeze, deployment);

    // Evidencia visual indica capturas históricas
    expect(rendered["submission-checklist.md"]).toContain("históricas");
    expect(rendered["submission-checklist.md"]).toContain(
      "f423a208a7f8c140a1dfa342e8689d3b6d967e94",
    );
    expect(rendered["submission-checklist.md"]).toContain(
      "f1aeb187ca243165efc63753840e5eb76db9ba4c",
    );
    expect(rendered["submission-checklist.md"]).toContain(
      "La recaptura del commit desplegado está pendiente",
    );
    // Checks de revisión de capturas sin marcar
    expect(rendered["submission-checklist.md"]).toContain(
      "- [ ] Revisar las capturas en contexto anónimo, sin datos personales ni credenciales.",
    );
    expect(rendered["submission-checklist.md"]).toContain(
      "- [ ] Confirmar que las cifras visibles siguen coincidiendo",
    );
    // Aprobación humana sigue pendiente
    expect(rendered["submission-checklist.md"]).toContain(
      "- [ ] Obtener aprobación humana explícita para la solicitud externa.",
    );
  });

  it("renders pending deployment with visual evidence pending and unchecked checks", () => {
    const deployment: ContestDeploymentEvidence = {
      status: "pending",
      commitSha: null,
      workflowRunId: null,
      verifiedAt: null,
      captureProductCommitSha: null,
      captureCount: null,
      capturesAreCurrent: false,
    };
    const rendered = renderContestSubmission(freeze, deployment);

    // deployment pending => current visual capture pending; prior captures historical
    expect(rendered["submission-checklist.md"]).toContain(
      "El inventario A4 conserva 13 capturas históricas",
    );
    // Checks sin marcar
    expect(rendered["submission-checklist.md"]).toContain(
      "- [ ] Revisar las capturas en contexto anónimo, sin datos personales ni credenciales.",
    );
    expect(rendered["submission-checklist.md"]).toContain(
      "- [ ] Confirmar que las cifras visibles siguen coincidiendo",
    );
    // Deployment gate sin marcar
    expect(rendered["submission-checklist.md"]).toContain(
      "- [ ] Rellenar el commit desplegado y el run del workflow con datos observados.",
    );
    // Release gate sin marcar
    expect(rendered["submission-checklist.md"]).toContain(
      "- [ ] Cerrar el gate documental conjunto; comprobar el alcance de pruebas ya ejecutadas en la evidencia de la release.",
    );
  });

  it("renders historical captures with captureCount when captureProductCommitSha is null", () => {
    const deployment: ContestDeploymentEvidence = {
      status: "verified",
      commitSha: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
      workflowRunId: "31546107126",
      verifiedAt: "2026-08-11T23:33:46Z",
      captureProductCommitSha: null,
      captureCount: 5,
      capturesAreCurrent: false,
    };
    const rendered = renderContestSubmission(freeze, deployment);

    expect(rendered["submission-checklist.md"]).toContain("las 5 capturas son");
    expect(rendered["submission-checklist.md"]).toContain("históricas");
    expect(rendered["submission-checklist.md"]).toContain(
      "- [ ] Revisar las capturas en contexto anónimo, sin datos personales ni credenciales. ",
    );
  });

  it("renders verified publication separately from pending current captures", () => {
    const deployment = {
      status: "verified" as const,
      commitSha: "f55de804cc94b5d928484e846b933a9dea94b7d0",
      workflowRunId: "32597524256",
      verifiedAt: "2026-08-25T04:35:12Z",
      captureProductCommitSha: null,
      captureCount: 0,
      capturesAreCurrent: false,
      releaseGatesVerified: false,
      releaseTag: "v2026.08.22",
      versionJsonUrl:
        "https://huntsman1756.github.io/concursos_cyl/version.json",
      versionJsonCommitSha: "f55de804cc94b5d928484e846b933a9dea94b7d0",
    } as ContestDeploymentEvidence;
    const rendered = renderContestSubmission(freeze, deployment);

    expect(rendered["technical-evidence.md"]).toContain(
      "f55de804cc94b5d928484e846b933a9dea94b7d0",
    );
    expect(rendered["technical-evidence.md"]).toContain(
      "Catálogo de comandos de reproducción",
    );
    expect(rendered["submission-checklist.md"]).toContain(
      "Release: `v2026.08.22`",
    );
    expect(rendered["submission-checklist.md"]).toContain(
      "https://huntsman1756.github.io/concursos_cyl/",
    );
    expect(rendered["submission-checklist.md"]).toContain(
      "https://huntsman1756.github.io/concursos_cyl/version.json",
    );
    expect(rendered["submission-checklist.md"]).toContain(
      "- [ ] Cerrar el gate documental conjunto; comprobar el alcance de pruebas ya ejecutadas en la evidencia de la release.",
    );
    expect(rendered["submission-checklist.md"]).toContain(
      "- [x] Registrar el commit publicado y su método de despliegue con datos observados.",
    );
    expect(rendered["submission-checklist.md"]).toContain(
      "El inventario A4 conserva 13 capturas históricas",
    );
    expect(rendered["submission-checklist.md"]).toContain(
      "Completar la revisión humana de accesibilidad",
    );
    expect(rendered["submission-checklist.md"]).toContain(
      "Una actualización documental no modifica por sí sola la versión pública.",
    );
  });

  it("is byte-stable and rejects forbidden or stale claims", () => {
    const first = renderContestSubmission(freeze);
    const second = renderContestSubmission(freeze);

    expect(second).toEqual(first);
    expect(() => validateRenderedContestSubmission(first)).not.toThrow();
    for (const content of Object.values(first)) {
      expect(content.endsWith("\n")).toBe(true);
      expect(content.match(/\n+$/u)?.[0]).toBe("\n");
      expect(content).not.toMatch(/\n{3,}/u);
      expect(content).not.toContain("**6 cualificaciones distintas**");
      expect(content).not.toMatch(/salario esperado|tasa de empleo/iu);
    }
  });

  it("keeps the jury memo aligned with the frozen coverage", () => {
    const memo = readFileSync(
      resolve(process.cwd(), "docs/contest/jury-memo.md"),
      "utf8",
    );
    const offerCount =
      freeze.manifest.resourceSnapshots.jobOffers.recordCount.toLocaleString(
        "es-ES",
        { useGrouping: "always" },
      );

    expect(memo).toContain(freeze.manifest.snapshotId);
    expect(memo).toContain(
      `${freeze.coverage.approvedRelationCount} relaciones FP–ocupación`,
    );
    expect(memo).toContain(
      `${freeze.coverage.distinctQualificationCount} cualificaciones distintas`,
    );
    expect(memo).toContain(
      `${freeze.coverage.modalityKeyCount} claves de modalidad`,
    );
    expect(memo).toContain(
      `${freeze.offers.matchedOfferCount} ofertas alcanzadas pertenecen a una copia fechada de ${offerCount} ofertas`,
    );
  });
});
