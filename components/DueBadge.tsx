import type { DueBadge as DueBadgeData } from "@/lib/dueStatus";

export default function DueBadge({
  badge,
  compact = false,
}: {
  badge: DueBadgeData | null | undefined;
  compact?: boolean;
}) {
  if (!badge) return null;

  const cls = compact
    ? "rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white shrink-0"
    : "rounded-full px-2.5 py-1 text-xs font-semibold text-white";

  if (badge.variant === "today") {
    return (
      <span className={cls} style={{ backgroundColor: "#8B5CF6" }}>
        {compact ? "Auj." : "Aujourd'hui"}
      </span>
    );
  }

  return (
    <span className={cls} style={{ backgroundColor: "#F0654B" }}>
      {compact ? `-${badge.lateDays}j` : `En retard de ${badge.lateDays} j`}
    </span>
  );
}
