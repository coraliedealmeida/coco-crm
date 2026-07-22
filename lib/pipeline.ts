import { PipelineStatus } from "@prisma/client";

export const pipelineColumns: { status: PipelineStatus; label: string; color: string }[] = [
  { status: "ROUTINE_ENGAGEMENT", label: "Routine d'engagement", color: "#C4B5FD" },
  { status: "PREMIER_DM", label: "Premier DM", color: "#8B5CF6" },
  { status: "RELANCE_1", label: "Relance 1", color: "#A78BFA" },
  { status: "RELANCE_2", label: "Relance 2", color: "#7C3AED" },
  { status: "GHOSTE", label: "Ghosté", color: "#9CA3AF" },
  { status: "EN_DISCUSSION", label: "En discussion", color: "#60A5FA" },
  { status: "APPEL_PREVU", label: "Appel découverte", color: "#34D399" },
  { status: "DEVIS_A_FAIRE", label: "Devis à faire", color: "#FBBF24" },
  { status: "DEVIS_ENVOYE", label: "Devis envoyé", color: "#FB923C" },
  { status: "RELANCE_DEVIS_1", label: "Relance devis 1", color: "#F59E0B" },
  { status: "RELANCE_DEVIS_2", label: "Relance devis 2", color: "#D97706" },
  { status: "DEVIS_ACCEPTE", label: "Devis accepté", color: "#CCFF00" },
  { status: "DEVIS_REFUSE", label: "Devis refusé", color: "#EF4444" },
  { status: "ARCHIVE", label: "Archivé", color: "#D1D5DB" },
  { status: "PAS_MAINTENANT", label: "Pas maintenant", color: "#C4B5FD" },
];

export function statusLabel(status: PipelineStatus): string {
  return pipelineColumns.find((c) => c.status === status)?.label ?? status;
}

export function statusColor(status: PipelineStatus): string {
  return pipelineColumns.find((c) => c.status === status)?.color ?? "#9CA3AF";
}

/**
 * Le pipeline visuel regroupe les 11 statuts détaillés en 4 colonnes macro,
 * pour éviter un scroll horizontal interminable. Le statut détaillé exact
 * reste modifiable depuis le menu déroulant de chaque carte.
 */
export type MacroGroup = {
  id: string;
  label: string;
  color: string;
  statuses: PipelineStatus[];
};

export const macroGroups: MacroGroup[] = [
  {
    id: "A_CONTACTER",
    label: "À contacter",
    color: "#C4B5FD",
    statuses: ["ROUTINE_ENGAGEMENT", "PREMIER_DM"],
  },
  {
    id: "A_RELANCER",
    label: "À relancer",
    color: "#8B5CF6",
    statuses: ["RELANCE_1", "RELANCE_2"],
  },
  {
    id: "EN_DISCUSSION",
    label: "En discussion",
    color: "#60A5FA",
    statuses: ["EN_DISCUSSION", "APPEL_PREVU", "DEVIS_A_FAIRE", "DEVIS_ENVOYE", "RELANCE_DEVIS_1", "RELANCE_DEVIS_2"],
  },
  {
    id: "CLOSING",
    label: "Closing",
    color: "#CCFF00",
    statuses: ["DEVIS_ACCEPTE", "GHOSTE", "DEVIS_REFUSE", "ARCHIVE"],
  },
  {
    id: "EN_PAUSE",
    label: "En pause",
    color: "#C4B5FD",
    statuses: ["PAS_MAINTENANT"],
  },
];

export function macroGroupForStatus(status: PipelineStatus): MacroGroup {
  return macroGroups.find((g) => g.statuses.includes(status)) ?? macroGroups[0];
}

/** Statuts qui comptent comme "archivés" : on enregistre archivedAt et on les exclut des calculs actifs. */
export const archivingStatuses: PipelineStatus[] = ["ARCHIVE", "DEVIS_REFUSE"];

/**
 * Le compteur de jours d'engagement n'a de sens que pendant la routine d'engagement
 * elle-même (une marque créée sans routine, ou passée à l'étape suivante, n'a plus
 * de compteur à afficher), et seulement jusqu'au seuil du feu vert (au-delà, l'info a
 * rempli son rôle de signal et devient juste du bruit).
 */
export function showsEngagementDays(status: PipelineStatus, days: number, greenLightThreshold: number): boolean {
  return status === "ROUTINE_ENGAGEMENT" && days <= greenLightThreshold;
}

const nextAutomaticAction: Partial<Record<PipelineStatus, string>> = {
  PREMIER_DM: "Relance 1",
  RELANCE_1: "Relance 2",
  APPEL_PREVU: "Devis à faire",
  DEVIS_ENVOYE: "Relance devis 1",
  RELANCE_DEVIS_1: "Relance devis 2",
};

/** Décrit l'action que représente le nextActionDate calculé automatiquement, selon le statut courant. */
export function nextAutomaticActionLabel(status: PipelineStatus): string | null {
  return nextAutomaticAction[status] ?? null;
}

export const platformLabel: Record<string, string> = {
  LINKEDIN: "LinkedIn",
  INSTAGRAM: "Instagram",
  BOTH: "LinkedIn & Instagram",
};

export const platformBadge: Record<string, { bg: string; text: string; icon: string }> = {
  LINKEDIN: { bg: "#E0ECFF", text: "#2563EB", icon: "in" },
  INSTAGRAM: { bg: "#FCE7F3", text: "#DB2777", icon: "ig" },
  BOTH: { bg: "#EDE9FE", text: "#7C3AED", icon: "in/ig" },
};

const avatarPalette = ["#8B5CF6", "#7C3AED", "#A78BFA", "#60A5FA", "#34D399", "#FB923C", "#DB2777"];

export function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return avatarPalette[hash % avatarPalette.length];
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
