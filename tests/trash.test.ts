import { describe, expect, it } from "vitest";
import { isUntouchedProject, leavesAccepted } from "@/lib/trash";
import { cancelledAcceptanceNotice } from "@/lib/apiClient";
import { projectSteps } from "@/lib/serviceTypes";

const blank = {
  serviceType: "LA_PATTE" as const,
  steps: [] as string[],
  currentStep: "",
  _count: { invoices: 0, trackingNotes: 0, reminders: 0 },
};

describe("projet vierge (masquable si le devis est annulé)", () => {
  const first = projectSteps[blank.serviceType][0];
  const second = projectSteps[blank.serviceType][1];

  it("vierge : aucune facture, note ni rappel, première étape", () => {
    expect(isUntouchedProject({ ...blank, currentStep: first })).toBe(true);
  });

  it("déjà travaillé : jamais masqué automatiquement", () => {
    expect(isUntouchedProject({ ...blank, currentStep: second })).toBe(false);
    expect(isUntouchedProject({ ...blank, currentStep: first, _count: { ...blank._count, invoices: 1 } })).toBe(false);
    expect(isUntouchedProject({ ...blank, currentStep: first, _count: { ...blank._count, trackingNotes: 1 } })).toBe(false);
    expect(isUntouchedProject({ ...blank, currentStep: first, _count: { ...blank._count, reminders: 2 } })).toBe(false);
  });
});

describe("annulation d'un « Devis accepté »", () => {
  it("détecte la sortie de « Devis accepté »", () => {
    expect(leavesAccepted("DEVIS_ACCEPTE", "DEVIS_A_FAIRE")).toBe(true);
    expect(leavesAccepted("DEVIS_ACCEPTE", "DEVIS_ACCEPTE")).toBe(false);
    expect(leavesAccepted("DEVIS_ENVOYE", "DEVIS_A_FAIRE")).toBe(false);
    expect(leavesAccepted("DEVIS_ACCEPTE", undefined)).toBe(false);
  });

  it("message clair pour Coralie", () => {
    expect(cancelledAcceptanceNotice({ projectsHidden: 1, projectsKept: 0 })).toContain("1 projet créé par ce devis a été masqué");
    expect(cancelledAcceptanceNotice({ projectsHidden: 0, projectsKept: 2 })).toContain("2 projets contiennent déjà des informations");
    expect(cancelledAcceptanceNotice({ projectsHidden: 0, projectsKept: 0 })).toBeNull();
    expect(cancelledAcceptanceNotice({ ok: true })).toBeNull();
  });
});
