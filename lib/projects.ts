import { ServiceType } from "@prisma/client";
import { countBusinessDays } from "@/lib/business-days";
import { projectSteps, serviceTypeLabel } from "@/lib/serviceTypes";

/** Libellé affiché pour un projet : son nom libre s'il en a un, sinon le type de prestation. */
export function projectLabel(project: { name: string | null; serviceType: ServiceType }): string {
  return project.name || serviceTypeLabel[project.serviceType];
}

// Étapes communes à toutes les prestations (cf. lib/serviceTypes.ts) qui bornent les 3
// colonnes macro du Kanban Projets. Seul le milieu ("En cours") varie selon le type.
export const ONBOARDING_STEPS = ["Devis signé", "Attente acompte"];
export const OFFBOARDING_STEPS = ["Facture à faire", "Facture envoyée", "Attente avis", "Terminé"];

export type ProjectMacroGroupId = "ONBOARDING" | "EN_COURS" | "OFFBOARDING";

export const projectMacroGroups: { id: ProjectMacroGroupId; label: string; color: string }[] = [
  { id: "ONBOARDING", label: "Onboarding", color: "#C4B5FD" },
  { id: "EN_COURS", label: "En cours", color: "#8B5CF6" },
  { id: "OFFBOARDING", label: "Offboarding", color: "#CCFF00" },
];

export function macroGroupForStep(step: string): ProjectMacroGroupId {
  if (ONBOARDING_STEPS.includes(step)) return "ONBOARDING";
  if (OFFBOARDING_STEPS.includes(step)) return "OFFBOARDING";
  return "EN_COURS";
}

/** Liste ordonnée des étapes d'un projet : ses statuts personnalisés si définis, sinon le modèle du type. */
export function resolveSteps(serviceType: ServiceType, steps: string[]): string[] {
  return steps.length > 0 ? steps : projectSteps[serviceType];
}

/**
 * Insère un statut personnalisé dans la liste d'un projet, à la fin de la zone "En cours"
 * (juste avant la première étape d'Offboarding) — l'emplacement naturel pour une révision
 * supplémentaire. Matérialise la liste depuis le modèle si le projet n'en avait pas encore.
 */
export function insertCustomStep(
  serviceType: ServiceType,
  steps: string[],
  label: string,
  afterStep?: string
): string[] {
  const base = resolveSteps(serviceType, steps);
  let insertAt: number;
  if (afterStep) {
    const afterIndex = base.indexOf(afterStep);
    insertAt = afterIndex === -1 ? base.length : afterIndex + 1;
  } else {
    const firstOffboardingIndex = base.findIndex((s) => OFFBOARDING_STEPS.includes(s));
    insertAt = firstOffboardingIndex === -1 ? base.length : firstOffboardingIndex;
  }
  return [...base.slice(0, insertAt), label, ...base.slice(insertAt)];
}

/** Retire un statut de la liste d'un projet (utilisé pour supprimer un statut personnalisé). */
export function removeStep(serviceType: ServiceType, steps: string[], label: string): string[] {
  const base = resolveSteps(serviceType, steps);
  return base.filter((s) => s !== label);
}

/** Statuts par défaut du type de prestation (permet de distinguer les statuts personnalisés ajoutés). */
export function isCustomStep(serviceType: ServiceType, step: string): boolean {
  return !projectSteps[serviceType].includes(step);
}

/** Première étape de chaque colonne macro pour un projet donné (utilisé par le glisser-déposer). */
export function firstStepOfMacroGroup(steps: string[], group: ProjectMacroGroupId): string {
  return steps.find((s) => macroGroupForStep(s) === group) ?? steps[0];
}

export function isProjectDone(project: { currentStep: string }): boolean {
  return project.currentStep === "Terminé";
}

// ---- Facturation : liste libre de factures par projet ----
// Aucun montant/date n'est jamais déduit ou pré-rempli automatiquement : le nombre de
// factures (acompte + solde, ou 3x/4x...) et leurs dates sont entièrement saisis à la main,
// pour s'adapter à n'importe quel échéancier de paiement.

type InvoiceLike = { amount: number; sentAt: Date | null; paidAt: Date | null };

/** Montant déjà facturé (factures envoyées, payées ou non) sur ce projet. */
export function invoicedTotal(invoices: InvoiceLike[]): number {
  return invoices.filter((i) => i.sentAt).reduce((sum, i) => sum + i.amount, 0);
}

/** Montant réellement encaissé sur ce projet. Alimente le CA généré. */
export function paidTotal(invoices: InvoiceLike[]): number {
  return invoices.filter((i) => i.paidAt).reduce((sum, i) => sum + i.amount, 0);
}

/** Reste à facturer par rapport au montant du devis (peut être négatif si sur-facturé). */
export function remainingToInvoice(quoteAmount: number | null, invoices: InvoiceLike[]): number {
  return (quoteAmount ?? 0) - invoicedTotal(invoices);
}

/** Factures envoyées et toujours impayées, les plus anciennes d'abord. */
export function pendingInvoices(invoices: InvoiceLike[]): InvoiceLike[] {
  return invoices
    .filter((i) => i.sentAt && !i.paidAt)
    .sort((a, b) => a.sentAt!.getTime() - b.sentAt!.getTime());
}

function inMonth(date: Date | null, now: Date): boolean {
  return !!date && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

/** Montant facturé sur le mois courant, toutes factures confondues. */
export function invoicedInMonth(invoices: InvoiceLike[], now: Date = new Date()): number {
  return invoices.filter((i) => inMonth(i.sentAt, now)).reduce((sum, i) => sum + i.amount, 0);
}

/** Montant encaissé sur le mois courant, toutes factures confondues. */
export function paidInMonth(invoices: InvoiceLike[], now: Date = new Date()): number {
  return invoices.filter((i) => inMonth(i.paidAt, now)).reduce((sum, i) => sum + i.amount, 0);
}

type InvoiceRelanceSettings = { daysBeforeFactureRelance1: number; daysBeforeFactureRelance2: number };

/**
 * La plus ancienne facture envoyée et toujours impayée déclenche une relance après X jours
 * (relance 1), puis à nouveau après Y jours supplémentaires (relance 2) — même logique que
 * les relances devis, calculée à la volée depuis sa date d'envoi.
 */
export function factureRelanceDue(
  invoices: InvoiceLike[],
  settings: InvoiceRelanceSettings,
  now: Date = new Date()
): 1 | 2 | null {
  const [oldest] = pendingInvoices(invoices);
  if (!oldest?.sentAt) return null;
  const elapsed = countBusinessDays(oldest.sentAt, now);
  if (elapsed >= settings.daysBeforeFactureRelance1 + settings.daysBeforeFactureRelance2) return 2;
  if (elapsed >= settings.daysBeforeFactureRelance1) return 1;
  return null;
}

/** Compteur visuel 1/3 — 2/3 — 3/3 pour l'Accompagnement mensuel, basé sur la date de début saisie. */
export function monthlyCycleProgress(startDate: Date | null, now: Date = new Date()): number | null {
  if (!startDate) return null;
  const monthsElapsed =
    (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
  const cyclePosition = ((monthsElapsed % 3) + 3) % 3;
  return cyclePosition + 1;
}
