"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatRevenue } from "@/lib/format";

export type ClientRow = {
  id: string;
  brandId: string;
  name: string;
  emoji: string | null;
  revenue: number;
  activeProjectCount: number;
  lastProjectDate: string | null;
};

type SortKey = "name" | "activeProjectCount" | "lastProjectDate" | "revenue";

export default function ClientsTable({ rows }: { rows: ClientRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("activeProjectCount");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  }

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let result = 0;
      if (sortKey === "name") result = a.name.localeCompare(b.name, "fr");
      else if (sortKey === "lastProjectDate") {
        const aTime = a.lastProjectDate ? new Date(a.lastProjectDate).getTime() : -Infinity;
        const bTime = b.lastProjectDate ? new Date(b.lastProjectDate).getTime() : -Infinity;
        result = aTime - bTime;
      } else result = a[sortKey] - b[sortKey];
      return sortDir === "asc" ? result : -result;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-soft">
      <table className="w-full text-left text-sm">
        <thead className="bg-soft text-ink/60">
          <tr>
            <SortableHeader label="Client" active={sortKey === "name"} dir={sortDir} onClick={() => toggleSort("name")} />
            <SortableHeader
              label="Projets en cours"
              active={sortKey === "activeProjectCount"}
              dir={sortDir}
              onClick={() => toggleSort("activeProjectCount")}
            />
            <SortableHeader
              label="Date du dernier projet"
              active={sortKey === "lastProjectDate"}
              dir={sortDir}
              onClick={() => toggleSort("lastProjectDate")}
            />
            <SortableHeader
              label="CA généré"
              active={sortKey === "revenue"}
              dir={sortDir}
              onClick={() => toggleSort("revenue")}
            />
          </tr>
        </thead>
        <tbody>
          {sorted.map((c) => (
            <tr key={c.id} className="border-t border-soft hover:bg-soft/50">
              <td className="px-5 py-3">
                <Link
                  href={`/marques/${c.brandId}?from=clients`}
                  className="flex items-center gap-2.5 font-semibold text-ink hover:underline"
                >
                  {c.emoji && <span className="text-base">{c.emoji}</span>}
                  {c.name}
                </Link>
              </td>
              <td className="px-5 py-3 text-ink/70">
                {c.activeProjectCount > 0 ? (
                  <span className="rounded-full bg-accent-light/40 px-2.5 py-1 text-xs font-semibold text-accent">
                    {c.activeProjectCount} en cours
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-5 py-3 text-ink/70">
                {c.lastProjectDate ? new Date(c.lastProjectDate).toLocaleDateString("fr-FR") : "—"}
              </td>
              <td className="px-5 py-3 font-semibold text-ink">{formatRevenue(c.revenue)}</td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={4} className="px-5 py-6 text-center text-ink/50">
                Aucun client pour le moment.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function SortableHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <th className="px-5 py-3 font-semibold">
      <button onClick={onClick} className="flex items-center gap-1 hover:text-ink">
        {label}
        <span className={active ? "text-accent" : "text-ink/20"}>{dir === "asc" ? "▲" : "▼"}</span>
      </button>
    </th>
  );
}
