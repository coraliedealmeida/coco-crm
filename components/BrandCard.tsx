import Link from "next/link";
import { avatarColor, initials, platformBadge } from "@/lib/pipeline";

export type BrandCardData = {
  id: string;
  name: string;
  platform: "LINKEDIN" | "INSTAGRAM" | "BOTH";
  potentialRevenue?: number | null;
  engagementDays?: number | null;
  /** Phase 2 — n'affiche rien tant que ces données n'existent pas. */
  paymentStatus?: string | null;
  serviceType?: string | null;
};

function formatRevenue(amount: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    amount
  );
}

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
}: {
  brand: BrandCardData;
  statusContent: React.ReactNode;
  engagementColor?: string;
  footer?: React.ReactNode;
}) {
  const badge = platformBadge[brand.platform];

  return (
    <div className="rounded-2xl bg-white p-4 shadow-md transition hover:shadow-lg">
      <div className="mb-3 flex items-center gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white"
          style={{ backgroundColor: avatarColor(brand.name) }}
        >
          {initials(brand.name)}
        </div>
        <div className="flex-1 overflow-hidden">
          <Link href={`/marques/${brand.id}`} className="truncate text-sm font-extrabold text-ink hover:underline">
            {brand.name}
          </Link>
          <span
            className="mt-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ backgroundColor: badge.bg, color: badge.text }}
          >
            {badge.icon}
          </span>
        </div>
      </div>

      <div className="mb-2.5">{statusContent}</div>

      {footer}

      <div className="mt-3 flex flex-wrap gap-1.5">
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
            🔥 {brand.engagementDays}j d&apos;engagement
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
