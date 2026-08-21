import { PipelineStatus } from "@prisma/client";

/**
 * Sous-ensemble de PipelineStatus pertinent pour une demande de devis sur un client déjà
 * existant : pas d'étapes de prospection à froid (routine, DM, appel...), on démarre
 * directement au stade du devis. Utilisé pour restreindre le menu déroulant de statut.
 */
export const quoteRequestStatuses: PipelineStatus[] = [
  "DEVIS_A_FAIRE",
  "DEVIS_ENVOYE",
  "RELANCE_DEVIS_1",
  "RELANCE_DEVIS_2",
  "DEVIS_ACCEPTE",
  "DEVIS_REFUSE",
  "PAS_MAINTENANT",
];

export function isQuoteRequestClosed(status: PipelineStatus): boolean {
  return status === "DEVIS_ACCEPTE" || status === "DEVIS_REFUSE";
}
