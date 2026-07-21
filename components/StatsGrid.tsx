import StatCard from "@/components/StatCard";

type Stat = { label: string; value: string; accent: string };

/**
 * Sur mobile, les StatCard (bandeau de couleur + grosse valeur) prennent trop de place
 * empilées à une par ligne : on les remplace par des lignes compactes dans une seule carte.
 * Inchangé à partir de sm (grille de StatCard classique).
 */
export default function StatsGrid({ stats }: { stats: Stat[] }) {
  return (
    <>
      <div className="overflow-hidden rounded-2xl bg-white shadow-soft sm:hidden">
        {stats.map((s, i) => (
          <div key={s.label} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-soft" : ""}`}>
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.accent }} />
            <span className="flex-1 text-xs font-light text-ink/60">{s.label}</span>
            <span className="font-sans text-base font-extrabold text-ink">{s.value}</span>
          </div>
        ))}
      </div>

      <div className="hidden gap-4 sm:grid sm:grid-cols-3">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} accent={s.accent} />
        ))}
      </div>
    </>
  );
}
