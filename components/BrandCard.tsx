import Link from "next/link";
import { avatarColor, initials, platformBadge } from "@/lib/pipeline";
import { formatRevenue } from "@/lib/format";
import DueBadge from "@/components/DueBadge";
import type { DueBadge as DueBadgeData } from "@/lib/dueStatus";

export type BrandCardData = {
  id: string;
  name: string;
  emoji?: string | null;
  /** Absent pour une carte qui ne représente pas une marque (ex : demande de devis) — masque le badge plateforme. */
  platform?: "LINKEDIN" | "INSTAGRAM" | "BOTH";
  acquisitionPath?: "ROUTINE" | "CONTACT" | "DIRECT" | null;
  potentialRevenue?: number | null;
  engagementDays?: number | null;
  /** Phase 2 — n'affiche rien tant que ces données n'existent pas. */
  paymentStatus?: string | null;
  serviceType?: string | null;
  /** Cible du lien si différente de /marques/{id} (ex : demande de devis → fiche du client concerné). */
  href?: string;
};

/**
 * Carte marque/projet unifiée, utilisée dans le Pipeline, le Dashboard, et
 * réutilisable en Phase 2 pour les cartes de suivi projet (statut de
 * paiement et type de prestation n'apparaissent que si renseignés).
 */
export default function BrandCard({
  brand,
  statusContent,
  engagementColor = "#8B5CF6",
  footer,
  dueBadge,
}: {
  brand: BrandCardData;
  statusContent: React.ReactNode;
  engagementColor?: string;
  footer?: React.ReactNode;
  /** Badge "Aujourd'hui"/"En retard de X jours" calculé par l'appelant (cf. lib/dueStatus.ts). */
  dueBadge?: DueBadgeData | null;
}) {
  const badge = brand.platform ? platformBadge[brand.platform] : null;
  const showPlatformBadge = !!badge && brand.acquisitionPath !== "CONTACT" && brand.acquisitionPath !== "DIRECT";
  const href = brand.href ?? `/marques/${brand.id}`;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-md transition hover:shadow-lg">
      <div className="mb-3 flex items-center gap-3">
        {brand.emoji ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-soft text-lg">
            {brand.emoji}
          </div>
        ) : (
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white"
            style={{ backgroundColor: avatarColor(brand.name) }}
          >
            {initials(brand.name)}
          </div>
        )}
        <Link
          href={href}
          className="flex-1 truncate text-sm font-extrabold text-ink hover:underline"
        >
          {brand.name}
        </Link>
        {showPlatformBadge && badge && (
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ backgroundColor: badge.bg, color: badge.text }}
          >
            {badge.icon}
          </span>
        )}
      </div>

      <div className="mb-2.5">{statusContent}</div>

      {footer}

      <div className="mt-3 flex flex-wrap gap-1.5">
        <DueBadge badge={dueBadge} />
        {brand.potentialRevenue != null && (
          <span className="rounded-full bg-cta/30 px-2.5 py-1 text-xs font-semibold text-ink">
            💰 {formatRevenue(brand.potentialRevenue)}
          </span>
        )}
        {brand.engagementDays != null && (
          <span
            className="rounded-full bg-soft px-2.5 py-1 text-xs font-semibold"
            style={{ color: engagementColor === "#CCFF00" ? "#1D1C1F" : engagementColor }}
          >
            🔥 J{brand.engagementDays}
          </span>
        )}
        {brand.paymentStatus && (
          <span className="rounded-full bg-accent-light/40 px-2.5 py-1 text-xs font-semibold text-accent">
            {brand.paymentStatus}
          </span>
        )}
        {brand.serviceType && (
          <span className="rounded-full bg-soft px-2.5 py-1 text-xs font-semibold text-ink/70">
            {brand.serviceType}
          </span>
        )}
      </div>
    </div>
  );
}
