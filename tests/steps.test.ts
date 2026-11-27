import { describe, expect, it } from "vitest";
import { projectSteps } from "@/lib/serviceTypes";
import { STEP } from "@/lib/steps";
import { isProjectActive, isProjectDone, macroGroupForStep } from "@/lib/projects";

// Listes d'étapes telles qu'elles étaient le 27/11/2026 : la centralisation ne doit rien changer.
const BEFORE: Record<string, string[]> = {
  LA_PATTE: ["Devis signé","Attente acompte","Questionnaire envoyé","Propositions DA","DA validée","Propositions concepts","Révision 1","Révision 2","Facture à faire","Facture envoyée","Attente avis","Terminé"],
  LEMPREINTE: ["Devis signé","Attente acompte","Questionnaire envoyé","Proposition DA","DA validée","Proposition concepts","Révisions 1","Révisions 2","Identité validée","Brandbook","Proposition templates","Révision templates","Livraison","Facture à faire","Facture envoyée","Attente avis","Terminé"],
  SITE_ONE_PAGE: ["Devis signé","Attente acompte","Questionnaire envoyé","Contenus reçus","Proposition maquette","Révision 1","Révision 2","Maquette validée","Intégration","Formation","Mise en ligne","Facture à faire","Facture envoyée","Attente avis","Terminé"],
  SITE_VITRINE: ["Devis signé","Attente acompte","Questionnaire envoyé","Contenus reçus","Proposition maquette","Révision 1","Révision 2","Maquette validée","Intégration","Formation","Mise en ligne","Facture à faire","Facture envoyée","Attente avis","Terminé"],
  KIT_RS: ["Devis signé","Attente acompte","Questionnaire envoyé","Proposition","Révision 1","Révision 2","Livraison Canva","Facture à faire","Facture envoyée","Attente avis","Terminé"],
  GRAPHISME_A_LA_CARTE: ["Devis signé","Attente acompte","En création","Révision 1","Révision 2","Livraison","Facture à faire","Facture envoyée","Attente avis","Terminé"],
  ACCOMPAGNEMENT_MENSUEL: ["Devis signé","Attente acompte","En création","Bilan mensuel","Renouvellement ou Fin","Facture à faire","Facture envoyée","Attente avis","Terminé"],
  ECOLES: ["Devis signé","Attente acompte","Confirmé","En cours","Facture à faire","Facture envoyée","Attente avis","Terminé"],
  JURY: ["Devis signé","Attente acompte","Confirmé","En cours","Facture à faire","Facture envoyée","Attente avis","Terminé"],
};

describe("étapes de projet centralisées", () => {
  it("les listes sont identiques à avant", () => {
    expect(projectSteps).toEqual(BEFORE);
  });

  it("regroupement Onboarding / En cours / Offboarding inchangé", () => {
    expect(macroGroupForStep(STEP.DEVIS_SIGNE)).toBe("ONBOARDING");
    expect(macroGroupForStep("Révision 1")).toBe("EN_COURS");
    expect(macroGroupForStep(STEP.FACTURE_A_FAIRE)).toBe("OFFBOARDING");
    expect(isProjectDone({ currentStep: "Terminé" })).toBe(true);
    expect(isProjectActive({ currentStep: "Attente avis" })).toBe(false);
    expect(isProjectActive({ currentStep: "En création" })).toBe(true);
  });
});
