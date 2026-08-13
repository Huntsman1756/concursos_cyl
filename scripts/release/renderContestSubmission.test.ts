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
    expect(rendered["application-summary.md"]).toContain("39 cualificaciones");
    expect(rendered["application-summary.md"]).toContain(
      "56 de las 1.044 ofertas de la instantánea",
    );
    expect(rendered["submission-checklist.md"]).toContain(
      "https://salida-cyl.157-90-22-40.sslip.io/",
    );
    expect(rendered["submission-checklist.md"]).toContain(
      "PENDIENTE DE APROBACIÓN HUMANA",
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
    expect(rendered["submission-checklist.md"]).toContain(
      "- [x] Ejecutar los gates de release y verificar la aplicación pública.",
    );
    // Capturas actuales: checks marcados
    expect(rendered["submission-checklist.md"]).toContain(
      "- [x] Revisar las capturas en contexto anónimo, sin datos personales ni credenciales.",
    );
    expect(rendered["submission-checklist.md"]).toContain(
      "- [x] Confirmar que las cifras visibles siguen coincidiendo",
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

    // deployment pending => visual evidence pending (no histórica)
    expect(rendered["submission-checklist.md"]).toContain(
      "evidencia visual pendiente (no histórica)",
    );
    expect(rendered["submission-checklist.md"]).not.toContain("históricas");
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
      "- [ ] Ejecutar los gates de release y verificar la aplicación pública.",
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

  it("is byte-stable and rejects forbidden or stale claims", () => {
    const first = renderContestSubmission(freeze);
    const second = renderContestSubmission(freeze);

    expect(second).toEqual(first);
    expect(() => validateRenderedContestSubmission(first)).not.toThrow();
    for (const content of Object.values(first)) {
      expect(content.endsWith("\n")).toBe(true);
      expect(content).not.toContain("12 cualificaciones");
      expect(content).not.toMatch(/salario esperado|tasa de empleo/iu);
    }
  });
});
