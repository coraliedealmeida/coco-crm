import type { DueBadge as DueBadgeData } from "@/lib/dueStatus";

/** Badge violet "Aujourd'hui" ou rouge/orange doux "En retard de X jours" (jours ouvrés). */
export default function DueBadge({ badge }: { badge: DueBadgeData | null | undefined }) {
  if (!badge) return null;

  if (badge.variant === "today") {
    return (
      <span
        className="rounded-full px-2.5 py-1 text-xs font-semibold text-white"
        style={{ backgroundColor: "#8B5CF6" }}
      >
        Aujourd&apos;hui
      </span>
    );
  }

  return (
    <span className="rounded-full px-2.5 py-1 text-xs font-semibold text-white" style={{ backgroundColor: "#F0654B" }}>
      En retard de {badge.lateDays} j
    </span>
  );
}
