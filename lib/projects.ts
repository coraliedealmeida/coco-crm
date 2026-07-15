import { ProjectPaymentStatus } from "@prisma/client";

export const paymentStatusLabel: Record<ProjectPaymentStatus, string> = {
  EN_ATTENTE_ACOMPTE: "En attente d'acompte",
  ACOMPTE_RECU: "Acompte reçu",
  A_FACTURER: "À facturer",
  FACTURE_ENVOYEE: "Facture envoyée",
  PAYE: "Payé",
};

export const paymentStatusOptions: { value: ProjectPaymentStatus; label: string }[] = (
  Object.keys(paymentStatusLabel) as ProjectPaymentStatus[]
).map((value) => ({ value, label: paymentStatusLabel[value] }));

type ProjectLike = { currentStep: string; paymentStatus: ProjectPaymentStatus };

export function isProjectDone(project: ProjectLike): boolean {
  return project.currentStep === "Terminé" || project.currentStep === "Payé";
}

export function isProjectPaid(project: ProjectLike): boolean {
  return project.paymentStatus === "PAYE";
}

/** Compteur visuel 1/3 — 2/3 — 3/3 pour l'Accompagnement mensuel, basé sur la date de début saisie. */
export function monthlyCycleProgress(startDate: Date | null, now: Date = new Date()): number | null {
  if (!startDate) return null;
  const monthsElapsed =
    (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
  const cyclePosition = ((monthsElapsed % 3) + 3) % 3;
  return cyclePosition + 1;
}
