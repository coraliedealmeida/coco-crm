"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import StatsGrid from "@/components/StatsGrid";
import { platformBadge } from "@/lib/pipeline";

interface Contact {
  name: string;
  position: string;
  profileUrl: string;
  platform: string;
}

interface Prospect {
  id: string;
  platform: string;
  rawName: string;
  handle: string | null;
  profileUrl: string | null;
  contacts: Contact[];
  brandCategory: string | null;
  status: string;
  scheduledDate: string | null;
  integratedAt: string | null;
}

interface Stats {
  total: number;
  validated: number;
  maybe: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  GRANDE_MARQUE: "Grande marque",
  PME_STARTUP: "PME / Startup",
  INDEPENDANT: "Indépendant",
};

const selectClass =
  "w-full rounded-xl border border-accent-light bg-soft px-3 py-2 text-sm text-ink outline-none transition focus:border-accent";

function FilterField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink/40">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
        {children}
      </select>
    </label>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function ImportClient({
  initialProspects,
  stats: initialStats,
}: {
  initialProspects: Prospect[];
  stats: Stats;
}) {
  const router = useRouter();
  const [prospects, setProspects] = useState<Prospect[]>(initialProspects);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [importing, setImporting] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [merging, setMerging] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [filterPlatform, setFilterPlatform] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [sortByName, setSortByName] = useState<"asc" | "desc" | null>(null);
  const sortActive = sortByName !== null;

  const filtersActive = filterPlatform !== "ALL" || filterCategory !== "ALL" || filterStatus !== "ALL";

  const resetFilters = () => {
    setFilterPlatform("ALL");
    setFilterCategory("ALL");
    setFilterStatus("ALL");
  };

  const toggleSortByName = () => {
    setSortByName((prev) => (prev === "asc" ? "desc" : prev === "desc" ? null : "asc"));
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await fetch("/api/import/parse", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "Erreur lors de l'import"); return; }
      alert(`Import terminé : ${data.linkedin} marques LinkedIn · ${data.instagram} comptes Instagram · ${data.total} total`);
      router.refresh();
    } finally {
      setImporting(false);
    }
  };

  const handleStatus = async (id: string, status: string) => {
    await fetch(`/api/import/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setProspects((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    setStats((prev) => {
      const p = prospects.find((x) => x.id === id);
      const wasOui = p?.status === "OUI";
      const isOui = status === "OUI";
      const wasMaybe = p?.status === "PLUS_TARD";
      const isMaybe = status === "PLUS_TARD";
      return {
        ...prev,
        validated: prev.validated + (isOui ? 1 : 0) - (wasOui ? 1 : 0),
        maybe: prev.maybe + (isMaybe ? 1 : 0) - (wasMaybe ? 1 : 0),
      };
    });
  };

  const handleCategory = async (id: string, brandCategory: string) => {
    await fetch(`/api/import/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandCategory: brandCategory || null }),
    });
    setProspects((prev) => prev.map((p) => (p.id === id ? { ...p, brandCategory: brandCategory || null } : p)));
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 2 ? [...prev, id] : prev));
  };

  const handleMerge = async () => {
    if (selected.length !== 2) return;
    setMerging(true);
    try {
      const [keepId, removeId] = selected;
      const res = await fetch("/api/import/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keepId, removeId }),
      });
      if (!res.ok) { alert("Erreur lors de la fusion"); return; }
      setSelected([]);
      router.refresh();
    } finally {
      setMerging(false);
    }
  };

  const handleSchedule = async () => {
    setScheduling(true);
    try {
      const res = await fetch("/api/import/schedule", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "Erreur"); return; }
      alert(data.scheduled > 0 ? `${data.scheduled} marque(s) programmée(s).` : (data.message ?? "Rien à programmer."));
      router.refresh();
    } finally {
      setScheduling(false);
    }
  };

  const filtered = useMemo(() => {
    const result = prospects.filter((p) => {
      if (filterPlatform !== "ALL" && p.platform !== filterPlatform) return false;
      if (filterCategory !== "ALL" && (p.brandCategory ?? "NONE") !== filterCategory) return false;
      if (filterStatus !== "ALL" && p.status !== filterStatus) return false;
      return true;
    });
    if (sortByName) {
      result.sort((a, b) => a.rawName.localeCompare(b.rawName, "fr"));
      if (sortByName === "desc") result.reverse();
    }
    return result;
  }, [prospects, filterPlatform, filterCategory, filterStatus, sortByName]);

  const toScheduleCount = prospects.filter((p) => p.status === "OUI" && !p.scheduledDate && !p.integratedAt).length;

  return (
    <div className="flex flex-col gap-6">
      <StatsGrid
        stats={[
          { label: "Marques importées", value: String(stats.total), accent: "#8B5CF6" },
          { label: "Validées", value: String(stats.validated), accent: "#CCFF00" },
          { label: "En attente", value: String(stats.maybe), accent: "#C4B5FD" },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        {prospects.length === 0 && (
          <button
            onClick={handleImport}
            disabled={importing}
            className="rounded-xl bg-cta px-5 py-3 font-semibold text-ink transition hover:opacity-90 disabled:opacity-50"
          >
            {importing ? "Import en cours…" : "↓ Lancer l'import"}
          </button>
        )}
        {selected.length === 2 && (
          <button
            onClick={handleMerge}
            disabled={merging}
            className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {merging ? "Fusion…" : "Fusionner les 2 sélectionnées"}
          </button>
        )}
        {toScheduleCount > 0 && (
          <button
            onClick={handleSchedule}
            disabled={scheduling}
            className="rounded-xl bg-cta px-5 py-3 font-semibold text-ink transition hover:opacity-90 disabled:opacity-50"
          >
            {scheduling ? "Programmation…" : `Programmer les ${toScheduleCount} validées`}
          </button>
        )}
      </div>

      {prospects.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-soft sm:flex-row sm:items-end sm:justify-between">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <FilterField label="Réseau" value={filterPlatform} onChange={setFilterPlatform}>
              <option value="ALL">Tous les réseaux</option>
              <option value="LINKEDIN">LinkedIn</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="BOTH">LinkedIn + Instagram</option>
            </FilterField>
            <FilterField label="Catégorie" value={filterCategory} onChange={setFilterCategory}>
              <option value="ALL">Toutes catégories</option>
              <option value="GRANDE_MARQUE">Grande marque</option>
              <option value="PME_STARTUP">PME / Startup</option>
              <option value="INDEPENDANT">Indépendant</option>
              <option value="NONE">Sans catégorie</option>
            </FilterField>
            <FilterField label="Statut" value={filterStatus} onChange={setFilterStatus}>
              <option value="ALL">Tous les statuts</option>
              <option value="PENDING">En attente</option>
              <option value="OUI">Validées</option>
              <option value="NON">Exclues</option>
              <option value="PLUS_TARD">Maybe</option>
            </FilterField>
          </div>
          <div className="flex items-center gap-3 whitespace-nowrap text-sm">
            {filtersActive && (
              <button onClick={resetFilters} className="font-semibold text-accent transition hover:underline">
                Réinitialiser
              </button>
            )}
            <span className="text-ink/40">{filtered.length} affichées</span>
            {selected.length > 0 && (
              <span className="text-ink/60">· {selected.length}/2 sélectionnées pour fusion</span>
            )}
          </div>
        </div>
      )}

      {prospects.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center shadow-soft">
          <p className="mb-2 font-sans text-lg font-extrabold text-ink">Aucune marque importée</p>
          <p className="text-sm font-light text-ink/50">
            Clique sur &ldquo;↓ Lancer l&apos;import&rdquo; pour analyser les exports LinkedIn et Instagram.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl bg-white shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-soft text-ink/60">
                <tr>
                  <th className="px-3 py-3"></th>
                  <th className="px-4 py-3 font-semibold">Réseau</th>
                  <th className="px-4 py-3 font-semibold">
                    <button onClick={toggleSortByName} className="flex items-center gap-1 hover:text-ink">
                      Marque
                      <span className={sortActive ? "text-accent" : "text-ink/20"}>
                        {sortByName === "desc" ? "▼" : sortByName === "asc" ? "▲" : "⇅"}
                      </span>
                    </button>
                  </th>
                  <th className="hidden px-4 py-3 font-semibold md:table-cell">Contacts</th>
                  <th className="px-4 py-3 font-semibold">Catégorie</th>
                  <th className="px-4 py-3 text-center font-semibold">Décision</th>
                  <th className="px-4 py-3 font-semibold">Programmation</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const badge = platformBadge[p.platform];
                  return (
                    <tr
                      key={p.id}
                      className={`border-t border-soft transition hover:bg-soft/50 ${p.status === "NON" ? "opacity-40" : ""}`}
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          disabled={!selected.includes(p.id) && selected.length >= 2}
                          style={{ accentColor: "#8B5CF6" }}
                        />
                      </td>
                      <td className="px-4 py-3">
                        {badge && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                            style={{ backgroundColor: badge.bg, color: badge.text }}
                          >
                            {badge.icon}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-ink">{p.rawName}</div>
                        {p.handle && <div className="text-xs font-light text-ink/40">@{p.handle}</div>}
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        {p.contacts.length > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            {p.contacts.slice(0, 2).map((c, i) => (
                              <span key={i} className="text-xs text-ink/60">
                                <span className="font-medium text-ink">{c.name}</span>
                                {c.position && <span className="text-ink/40"> · {c.position}</span>}
                              </span>
                            ))}
                            {p.contacts.length > 2 && (
                              <span className="text-xs text-ink/30">+{p.contacts.length - 2} autres</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-ink/25">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={p.brandCategory ?? ""}
                          onChange={(e) => handleCategory(p.id, e.target.value)}
                          className="rounded-lg border border-accent-light bg-soft px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                        >
                          <option value="">—</option>
                          <option value="GRANDE_MARQUE">{CATEGORY_LABELS.GRANDE_MARQUE}</option>
                          <option value="PME_STARTUP">{CATEGORY_LABELS.PME_STARTUP}</option>
                          <option value="INDEPENDANT">{CATEGORY_LABELS.INDEPENDANT}</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-1 rounded-xl bg-soft/60 p-1">
                          <button
                            onClick={() => handleStatus(p.id, p.status === "OUI" ? "PENDING" : "OUI")}
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                              p.status === "OUI" ? "bg-cta text-ink" : "text-ink/50 hover:bg-white"
                            }`}
                          >
                            Oui
                          </button>
                          <button
                            onClick={() => handleStatus(p.id, p.status === "NON" ? "PENDING" : "NON")}
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                              p.status === "NON" ? "bg-red-500 text-white" : "text-ink/50 hover:bg-white"
                            }`}
                          >
                            Non
                          </button>
                          <button
                            onClick={() => handleStatus(p.id, p.status === "PLUS_TARD" ? "PENDING" : "PLUS_TARD")}
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                              p.status === "PLUS_TARD" ? "bg-accent-light text-ink" : "text-ink/50 hover:bg-white"
                            }`}
                          >
                            Maybe
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {p.integratedAt ? (
                          <span className="rounded-full bg-cta/30 px-2.5 py-1 font-semibold text-ink">
                            Active depuis le {formatDate(p.integratedAt)}
                          </span>
                        ) : p.scheduledDate ? (
                          <span className="rounded-full bg-soft px-2.5 py-1 font-semibold text-ink/70">
                            Prévue le {formatDate(p.scheduledDate)}
                          </span>
                        ) : (
                          <span className="text-ink/25">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
