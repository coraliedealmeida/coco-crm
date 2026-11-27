/**
 * Noms des étapes communes à tous les types de projet — UNE seule source.
 * Toujours utiliser `STEP.TERMINE` etc. plutôt que d'écrire "Terminé" en toutes lettres :
 * renommer une étape (ex. « Attente avis » → « Demande d'avis », Phase 2) se fera ici,
 * accompagné d'une migration des projets existants.
 */
export const STEP = {
  DEVIS_SIGNE: "Devis signé",
  ATTENTE_ACOMPTE: "Attente acompte",
  FACTURE_A_FAIRE: "Facture à faire",
  FACTURE_ENVOYEE: "Facture envoyée",
  ATTENTE_AVIS: "Attente avis",
  TERMINE: "Terminé",
} as const;

/** Début commun à tous les types (colonne « Onboarding » du Kanban). */
export const ONBOARDING_STEPS: string[] = [STEP.DEVIS_SIGNE, STEP.ATTENTE_ACOMPTE];

/** Fin commune à tous les types (colonne « Offboarding » du Kanban). */
export const OFFBOARDING_STEPS: string[] = [STEP.FACTURE_A_FAIRE, STEP.FACTURE_ENVOYEE, STEP.ATTENTE_AVIS, STEP.TERMINE];

/** Liste complète d'un type = début commun + étapes propres au type + fin commune. */
export function withCommonSteps(middle: string[]): string[] {
  return [...ONBOARDING_STEPS, ...middle, ...OFFBOARDING_STEPS];
}
