import { ServiceType } from "@prisma/client";
import { withCommonSteps } from "@/lib/steps";

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
  LA_PATTE: withCommonSteps([
    "Questionnaire envoyé",
    "Propositions DA",
    "DA validée",
    "Propositions concepts",
    "Révision 1",
    "Révision 2",
  ]),
  LEMPREINTE: withCommonSteps([
    "Questionnaire envoyé",
    "Proposition DA",
    "DA validée",
    "Proposition concepts",
    "Révisions 1",
    "Révisions 2",
    "Identité validée",
    "Brandbook",
    "Proposition templates",
    "Révision templates",
    "Livraison",
  ]),
  SITE_ONE_PAGE: withCommonSteps([
    "Questionnaire envoyé",
    "Contenus reçus",
    "Proposition maquette",
    "Révision 1",
    "Révision 2",
    "Maquette validée",
    "Intégration",
    "Formation",
    "Mise en ligne",
  ]),
  SITE_VITRINE: withCommonSteps([
    "Questionnaire envoyé",
    "Contenus reçus",
    "Proposition maquette",
    "Révision 1",
    "Révision 2",
    "Maquette validée",
    "Intégration",
    "Formation",
    "Mise en ligne",
  ]),
  KIT_RS: withCommonSteps([
    "Questionnaire envoyé",
    "Proposition",
    "Révision 1",
    "Révision 2",
    "Livraison Canva",
  ]),
  GRAPHISME_A_LA_CARTE: withCommonSteps([
    "En création",
    "Révision 1",
    "Révision 2",
    "Livraison",
  ]),
  ACCOMPAGNEMENT_MENSUEL: withCommonSteps([
    "En création",
    "Bilan mensuel",
    "Renouvellement ou Fin",
  ]),
  ECOLES: withCommonSteps([
    "Confirmé",
    "En cours",
  ]),
  JURY: withCommonSteps([
    "Confirmé",
    "En cours",
  ]),
};
