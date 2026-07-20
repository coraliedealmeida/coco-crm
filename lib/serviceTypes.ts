import { ServiceType } from "@prisma/client";

export const serviceTypeLabel: Record<ServiceType, string> = {
  LA_PATTE: "La Patte",
  LEMPREINTE: "L'Empreinte",
  SITE_ONE_PAGE: "Site One Page",
  SITE_VITRINE: "Site Vitrine",
  KIT_RS: "Kit RS",
  GRAPHISME_A_LA_CARTE: "Graphisme à la carte",
  ACCOMPAGNEMENT_MENSUEL: "Accompagnement mensuel",
  ECOLES: "École",
  JURY: "Jury",
};

export const serviceTypeOptions: { value: ServiceType; label: string }[] = (
  Object.keys(serviceTypeLabel) as ServiceType[]
).map((value) => ({ value, label: serviceTypeLabel[value] }));

/**
 * Étapes du process par type de prestation, utilisées sur la fiche projet (Phase 2).
 * Un Project n'existe qu'une fois le devis déjà accepté (Appel découverte/Devis envoyé sont
 * déjà tracés côté Pipeline prospection) : chaque liste démarre donc sur les 2 étapes
 * d'onboarding communes ("Devis signé", "Attente acompte") et se termine sur les 4 étapes
 * d'offboarding communes ("Facture à faire", "Facture envoyée", "Attente avis", "Terminé") —
 * seul le milieu ("En cours") varie selon le type. Voir lib/projects.ts pour le regroupement
 * macro (Onboarding / En cours / Offboarding) utilisé par le Kanban Projets.
 */
export const projectSteps: Record<ServiceType, string[]> = {
  LA_PATTE: [
    "Devis signé",
    "Attente acompte",
    "Questionnaire envoyé",
    "Propositions DA",
    "DA validée",
    "Propositions concepts",
    "Révision 1",
    "Révision 2",
    "Facture à faire",
    "Facture envoyée",
    "Attente avis",
    "Terminé",
  ],
  LEMPREINTE: [
    "Devis signé",
    "Attente acompte",
    "Questionnaire envoyé",
    "Propositions DA",
    "DA validée",
    "Propositions concepts",
    "Révision 1",
    "Révision 2",
    "Facture à faire",
    "Facture envoyée",
    "Attente avis",
    "Terminé",
  ],
  SITE_ONE_PAGE: [
    "Devis signé",
    "Attente acompte",
    "Questionnaire envoyé",
    "Contenus reçus",
    "Proposition maquette",
    "Révision 1",
    "Révision 2",
    "Maquette validée",
    "Intégration",
    "Formation",
    "Mise en ligne",
    "Facture à faire",
    "Facture envoyée",
    "Attente avis",
    "Terminé",
  ],
  SITE_VITRINE: [
    "Devis signé",
    "Attente acompte",
    "Questionnaire envoyé",
    "Contenus reçus",
    "Proposition maquette",
    "Révision 1",
    "Révision 2",
    "Maquette validée",
    "Intégration",
    "Formation",
    "Mise en ligne",
    "Facture à faire",
    "Facture envoyée",
    "Attente avis",
    "Terminé",
  ],
  KIT_RS: [
    "Devis signé",
    "Attente acompte",
    "Questionnaire envoyé",
    "Proposition",
    "Révision 1",
    "Révision 2",
    "Livraison Canva",
    "Facture à faire",
    "Facture envoyée",
    "Attente avis",
    "Terminé",
  ],
  GRAPHISME_A_LA_CARTE: [
    "Devis signé",
    "Attente acompte",
    "En création",
    "Révision 1",
    "Révision 2",
    "Livraison",
    "Facture à faire",
    "Facture envoyée",
    "Attente avis",
    "Terminé",
  ],
  ACCOMPAGNEMENT_MENSUEL: [
    "Devis signé",
    "Attente acompte",
    "En création",
    "Bilan mensuel",
    "Renouvellement ou Fin",
    "Facture à faire",
    "Facture envoyée",
    "Attente avis",
    "Terminé",
  ],
  ECOLES: [
    "Devis signé",
    "Attente acompte",
    "Confirmé",
    "En cours",
    "Facture à faire",
    "Facture envoyée",
    "Attente avis",
    "Terminé",
  ],
  JURY: [
    "Devis signé",
    "Attente acompte",
    "Confirmé",
    "En cours",
    "Facture à faire",
    "Facture envoyée",
    "Attente avis",
    "Terminé",
  ],
};
