import { PipelineStatus } from "@prisma/client";
import { addBusinessDays } from "@/lib/business-days";

/**
 * Statuts pour lesquels le passage à ce statut a un sens d'action unique et
 * non ambigu (peu importe comment on y arrive : glisser-déposer, menu
 * déroulant, ou bouton Commentaires) — on peut donc logger automatiquement
 * le libellé d'action correspondant pour que les statistiques restent justes.
 *
 * "Devis à faire" est volontairement absent : on peut y arriver soit après
 * un appel réalisé, soit directement sans appel — l'action "Appel réalisé"
 * doit rester une validation explicite via Commentaires.
 */
export const statusActionType: Partial<Record<PipelineStatus, string>> = {
  PREMIER_DM: "Premier DM",
  RELANCE_1: "Relance 1",
  RELANCE_2: "Relance 2",
  EN_DISCUSSION: "Réponse reçue",
  APPEL_PREVU: "Appel découverte",
  DEVIS_ENVOYE: "Devis envoyé",
  RELANCE_DEVIS_1: "Relance devis 1",
  RELANCE_DEVIS_2: "Relance devis 2",
  DEVIS_REFUSE: "Devis refusé",
};

/** Mapping inverse : à partir d'un libellé d'action loggé (Suivi/Commentaires), quel statut a-t-il déclenché. */
export const statusForActionType: Partial<Record<string, PipelineStatus>> = {
  "Premier DM": "PREMIER_DM",
  "Relance 1": "RELANCE_1",
  "Relance 2": "RELANCE_2",
  "Réponse reçue": "EN_DISCUSSION",
  "Appel découverte": "APPEL_PREVU",
  "Appel réalisé": "DEVIS_A_FAIRE",
  "Devis envoyé": "DEVIS_ENVOYE",
  "Relance devis 1": "RELANCE_DEVIS_1",
  "Relance devis 2": "RELANCE_DEVIS_2",
  "Devis refusé": "DEVIS_REFUSE",
};

type RelanceSettings = {
  daysBeforeRelance1: number;
  daysBeforeRelance2: number;
  daysBeforeDevisRelance1: number;
  daysBeforeDevisRelance2: number;
};

/**
 * Calcule la prochaine date d'action pour les statuts qui en déclenchent une
 * automatiquement. Retourne `undefined` si ce statut ne doit pas modifier la
 * date existante (laisser intacte une éventuelle date déjà programmée).
 */
export function computeNextActionDate(
  status: PipelineStatus,
  now: Date,
  settings: RelanceSettings
): Date | null | undefined {
  switch (status) {
    case "PREMIER_DM":
      return addBusinessDays(now, settings.daysBeforeRelance1);
    case "RELANCE_1":
      return addBusinessDays(now, settings.daysBeforeRelance2);
    case "RELANCE_2":
      return null;
    case "DEVIS_ENVOYE":
      return addBusinessDays(now, settings.daysBeforeDevisRelance1);
    case "RELANCE_DEVIS_1":
      return addBusinessDays(now, settings.daysBeforeDevisRelance2);
    case "RELANCE_DEVIS_2":
      return null;
    case "PAS_MAINTENANT":
      return null;
    default:
      return undefined;
  }
}
