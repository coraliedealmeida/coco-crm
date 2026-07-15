// Regroupement d'affichage fixe, indépendant de la catégorie brute stockée en base :
// les Add-ons site web rejoignent visuellement "Site web", et Maintenance / Graphisme à la
// carte rejoignent "Abonnements" aux côtés de l'Accompagnement mensuel. Utilisé à la fois par
// la page Offre et le récapitulatif des notes d'appel découverte pour rester cohérents.
export const GROUP_ORDER = ["Identité visuelle", "Templates réseaux sociaux", "Site web", "Abonnements"];

const ABONNEMENT_NAMES = ["Accompagnement mensuel", "Maintenance", "Graphisme à la carte"];

export function groupFor(service: { name: string; category: string }): string {
  if (ABONNEMENT_NAMES.includes(service.name)) return "Abonnements";
  if (service.category === "Add-ons site web") return "Site web";
  if (service.category === "Services récurrents" || service.category === "Graphisme") return "Abonnements";
  return service.category;
}
