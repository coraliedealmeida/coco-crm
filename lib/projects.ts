import { ServiceType } from "@prisma/client";
import { countBusinessDays } from "@/lib/business-days";
import { projectSteps } from "@/lib/serviceTypes";

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
export function insertCustomStep(serviceType: ServiceType, steps: string[], label: string): string[] {
  const base = resolveSteps(serviceType, steps);
  const firstOffboardingIndex = base.findIndex((s) => OFFBOARDING_STEPS.includes(s));
  const insertAt = firstOffboardingIndex === -1 ? base.length : firstOffboardingIndex;
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

export const ATTENTE_ACOMPTE = "Attente acompte";
export const DEPOSIT_RATE = 0.3;

export function isProjectDone(project: { currentStep: string }): boolean {
  return project.currentStep === "Terminé";
}

// ---- Facturation acompte / solde ----
// Modèle "dérivé des étapes" : l'acompte (30% par défaut, modifiable) est facturé à l'étape
// "Attente acompte" et encaissé dès qu'on la dépasse ; le solde (le reste) est facturé à
// "Facture envoyée" et encaissé à "Attente avis". Aucune facture séparée à saisir.

type AmountLike = { quoteAmount: number | null; depositAmount: number | null };
type InvoiceDatesLike = {
  depositInvoicedAt: Date | null;
  depositPaidAt: Date | null;
  invoicedAt: Date | null;
  paidAt: Date | null;
};

export function depositAmount(p: AmountLike): number {
  if (p.depositAmount != null) return p.depositAmount;
  return Math.round((p.quoteAmount ?? 0) * DEPOSIT_RATE);
}

export function soldeAmount(p: AmountLike): number {
  return (p.quoteAmount ?? 0) - depositAmount(p);
}

/** Facture actuellement en attente de paiement pour ce projet (acompte ou solde), le cas échéant. */
export function pendingInvoice(
  p: AmountLike & InvoiceDatesLike
): { kind: "acompte" | "solde"; amount: number; sentAt: Date } | null {
  if (p.depositInvoicedAt && !p.depositPaidAt) {
    return { kind: "acompte", amount: depositAmount(p), sentAt: p.depositInvoicedAt };
  }
  if (p.invoicedAt && !p.paidAt) {
    return { kind: "solde", amount: soldeAmount(p), sentAt: p.invoicedAt };
  }
  return null;
}

/** Montant réellement encaissé sur ce projet (acompte payé + solde payé). Alimente le CA généré. */
export function paidAmount(p: AmountLike & InvoiceDatesLike): number {
  return (p.depositPaidAt ? depositAmount(p) : 0) + (p.paidAt ? soldeAmount(p) : 0);
}

function inMonth(date: Date | null, now: Date): boolean {
  return !!date && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

/** Montant facturé (acompte + solde) sur le mois courant. */
export function invoicedInMonth(p: AmountLike & InvoiceDatesLike, now: Date = new Date()): number {
  return (inMonth(p.depositInvoicedAt, now) ? depositAmount(p) : 0) + (inMonth(p.invoicedAt, now) ? soldeAmount(p) : 0);
}

/** Montant encaissé (acompte + solde) sur le mois courant. */
export function paidInMonth(p: AmountLike & InvoiceDatesLike, now: Date = new Date()): number {
  return (inMonth(p.depositPaidAt, now) ? depositAmount(p) : 0) + (inMonth(p.paidAt, now) ? soldeAmount(p) : 0);
}

/**
 * Calcule les dates d'acompte/solde à poser suite à un changement d'étape. Ne fait qu'avancer
 * ces dates (jamais les effacer si l'étape recule) — les valeurs déjà saisies (antidatage) sont
 * préservées.
 */
export function computeInvoiceDates(
  steps: string[],
  newStep: string,
  current: InvoiceDatesLike
): Partial<Record<keyof InvoiceDatesLike, Date>> {
  const newIndex = steps.indexOf(newStep);
  const acompteIndex = steps.indexOf(ATTENTE_ACOMPTE);
  const invoicedIndex = steps.indexOf("Facture envoyée");
  const paidIndex = steps.indexOf("Attente avis");

  const result: Partial<Record<keyof InvoiceDatesLike, Date>> = {};
  const now = new Date();

  if (!current.depositInvoicedAt && acompteIndex !== -1 && newIndex >= acompteIndex) result.depositInvoicedAt = now;
  if (!current.depositPaidAt && acompteIndex !== -1 && newIndex > acompteIndex) result.depositPaidAt = now;
  if (!current.invoicedAt && invoicedIndex !== -1 && newIndex >= invoicedIndex) result.invoicedAt = now;
  if (!current.paidAt && paidIndex !== -1 && newIndex >= paidIndex) result.paidAt = now;
  return result;
}

type InvoiceRelanceSettings = { daysBeforeFactureRelance1: number; daysBeforeFactureRelance2: number };

/**
 * Une facture (acompte ou solde) envoyée et toujours impayée déclenche une relance après X jours
 * (relance 1), puis à nouveau après Y jours supplémentaires (relance 2) — même logique que les
 * relances devis, calculée à la volée depuis la date d'envoi de la facture en attente.
 */
export function factureRelanceDue(
  project: AmountLike & InvoiceDatesLike,
  settings: InvoiceRelanceSettings,
  now: Date = new Date()
): 1 | 2 | null {
  const pending = pendingInvoice(project);
  if (!pending) return null;
  const elapsed = countBusinessDays(pending.sentAt, now);
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
