"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { avatarColor, initials } from "@/lib/pipeline";
import { formatRevenue } from "@/lib/format";

export type ClientCardData = {
  id: string;
  brandId: string;
  name: string;
  emoji: string | null;
  revenue: number;
  projects: { id: string; label: string; currentStep: string; color: string }[];
};

const MAX_VISIBLE_PROJECTS = 4;

type SortKey = "name" | "revenue" | "projectCount";

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "name", label: "Nom" },
  { key: "revenue", label: "CA généré" },
  { key: "projectCount", label: "Projets en cours" },
];

export default function ClientsGrid({ clients }: { clients: ClientCardData[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  }

  const sorted = useMemo(() => {
    const copy = [...clients];
    copy.sort((a, b) => {
      let result = 0;
      if (sortKey === "name") result = a.name.localeCompare(b.name, "fr");
      else if (sortKey === "revenue") result = a.revenue - b.revenue;
      else result = a.projects.length - b.projects.length;
      return sortDir === "asc" ? result : -result;
    });
    return copy;
  }, [clients, sortKey, sortDir]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex w-fit gap-1 rounded-2xl bg-white p-1.5 shadow-soft">
        {sortOptions.map((o) => (
          <button
            key={o.key}
            onClick={() => toggleSort(o.key)}
            className={`flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              sortKey === o.key ? "bg-accent text-white" : "text-ink/60 hover:bg-soft"
            }`}
          >
            {o.label}
            {sortKey === o.key && <span>{sortDir === "asc" ? "▲" : "▼"}</span>}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {sorted.map((client) => {
          const visible = client.projects.slice(0, MAX_VISIBLE_PROJECTS);
          const hiddenCount = client.projects.length - visible.length;

          return (
            <Link
              key={client.id}
              href={`/marques/${client.brandId}?from=clients`}
              className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-soft transition hover:shadow-softer"
            >
              <div className="flex items-center gap-3">
                {client.emoji ? (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-soft text-lg">
                    {client.emoji}
                  </div>
                ) : (
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white"
                    style={{ backgroundColor: avatarColor(client.name) }}
                  >
                    {initials(client.name)}
                  </div>
                )}
                <p className="truncate font-sans text-base font-extrabold text-ink">{client.name}</p>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-cta/25 px-3.5 py-2.5">
                <span className="text-xs font-light text-ink/60">CA généré</span>
                <span className="font-sans text-sm font-extrabold text-ink">{formatRevenue(client.revenue)}</span>
              </div>

              <div className="flex flex-col gap-1.5">
                {visible.length === 0 ? (
                  <p className="text-xs font-light text-ink/40">Aucun projet en cours.</p>
                ) : (
                  visible.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 rounded-lg bg-soft px-2.5 py-1.5">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="flex-1 truncate text-xs font-semibold text-ink">{p.label}</span>
                      <span className="shrink-0 truncate text-[11px] font-light text-ink/40">{p.currentStep}</span>
                    </div>
                  ))
                )}
                {hiddenCount > 0 && <p className="pl-1 text-xs font-light text-ink/40">+ {hiddenCount} autre(s)</p>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
