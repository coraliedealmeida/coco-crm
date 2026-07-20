"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { statusLabel, statusColor } from "@/lib/pipeline";
import type { PipelineStatus } from "@prisma/client";

type Row = {
  id: string;
  name: string;
  pipelineStatus: PipelineStatus;
  nextActionDate: string | null;
};

type SortKey = "name" | "nextActionDate";

export default function MarquesTable({ rows }: { rows: Row[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("nextActionDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let result = 0;
      if (sortKey === "name") {
        result = a.name.localeCompare(b.name, "fr");
      } else {
        const aTime = a.nextActionDate ? new Date(a.nextActionDate).getTime() : Infinity;
        const bTime = b.nextActionDate ? new Date(b.nextActionDate).getTime() : Infinity;
        result = aTime - bTime;
      }
      return sortDir === "asc" ? result : -result;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-soft">
      <table className="w-full text-left text-sm">
        <thead className="bg-soft text-ink/60">
          <tr>
            <SortableHeader label="Marque" active={sortKey === "name"} dir={sortDir} onClick={() => toggleSort("name")} />
            <th className="px-5 py-3 font-semibold">Statut</th>
            <SortableHeader
              label="Prochaine action"
              active={sortKey === "nextActionDate"}
              dir={sortDir}
              onClick={() => toggleSort("nextActionDate")}
            />
          </tr>
        </thead>
        <tbody>
          {sorted.map((b) => (
            <tr key={b.id} className="border-t border-soft hover:bg-soft/50">
              <td className="px-5 py-3">
                <Link href={`/marques/${b.id}?from=prospects`} className="font-semibold text-ink hover:underline">
                  {b.name}
                </Link>
              </td>
              <td className="px-5 py-3">
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{ backgroundColor: `${statusColor(b.pipelineStatus)}33`, color: statusColor(b.pipelineStatus) }}
                >
                  {statusLabel(b.pipelineStatus)}
                </span>
              </td>
              <td className="px-5 py-3 text-ink/70">
                {b.nextActionDate ? new Date(b.nextActionDate).toLocaleDateString("fr-FR") : "—"}
              </td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={3} className="px-5 py-6 text-center text-ink/50">
                Aucune marque pour le moment.
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
