"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function toDateInputValue(isoDate: string): string {
  return new Date(isoDate).toISOString().slice(0, 10);
}

type Entry = {
  id: string;
  type: string;
  content: string | null;
  date: string;
};

function EntryRow({ brandId, entry }: { brandId: string; entry: Entry }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [editingDate, setEditingDate] = useState(false);

  async function handleDelete() {
    if (!confirm("Supprimer cette entrée du suivi ? Cette action est irréversible.")) return;
    setDeleting(true);
    await fetch(`/api/brands/${brandId}/contact/${entry.id}`, { method: "DELETE" });
    router.refresh();
  }

  async function handleDateChange(value: string) {
    if (!value) return;
    setEditingDate(false);
    await fetch(`/api/brands/${brandId}/contact/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: new Date(value).toISOString() }),
    });
    router.refresh();
  }

  const highlighted = Boolean(entry.content) || entry.type === "Appel réalisé";
  const isDiscoveryCall = entry.type === "Appel découverte";

  return (
    <div
      className={`group rounded-xl px-4 py-3 ${
        highlighted ? "border-l-4 border-cta bg-cta/15" : "bg-soft"
      }`}
    >
      <div className="flex items-center justify-between">
        {isDiscoveryCall ? (
          <Link
            href={`/marques/${brandId}/notes`}
            className="flex items-center gap-1 text-sm font-semibold text-accent hover:underline"
          >
            📋 {entry.type}
            <span aria-hidden>→</span>
          </Link>
        ) : (
          <span className="text-sm font-semibold text-ink">
            {highlighted && <span className="mr-1">💬</span>}
            {entry.type}
          </span>
        )}
        <div className="flex items-center gap-2">
          {editingDate ? (
            <input
              type="date"
              autoFocus
              defaultValue={toDateInputValue(entry.date)}
              onBlur={() => setEditingDate(false)}
              onChange={(e) => handleDateChange(e.target.value)}
              className="rounded-lg border border-accent-light bg-soft px-2 py-1 text-xs text-ink outline-none focus:border-accent"
            />
          ) : (
            <button
              onClick={() => setEditingDate(true)}
              className="text-xs font-light text-ink/50 underline-offset-2 hover:underline"
              title="Modifier la date"
            >
              {new Date(entry.date).toLocaleDateString("fr-FR")}
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Supprimer cette entrée"
            className="text-ink/30 opacity-0 transition group-hover:opacity-100 hover:text-red-500"
          >
            ×
          </button>
        </div>
      </div>
      {entry.content && <p className="mt-1 text-sm font-light text-ink/70">{entry.content}</p>}
    </div>
  );
}

export default function HistoryPanel({ brandId, entries }: { brandId: string; entries: Entry[] }) {
  const [expanded, setExpanded] = useState(false);

  if (entries.length === 0) {
    return <p className="text-sm font-light text-ink/50">Aucun contact enregistré.</p>;
  }

  const [latest, ...rest] = entries;

  return (
    <div className="flex flex-col gap-3">
      <EntryRow brandId={brandId} entry={latest} />

      {rest.length > 0 && (
        <>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-fit text-xs font-semibold text-accent hover:underline"
          >
            {expanded ? "Réduire l'historique" : `Voir tout l'historique (${entries.length})`}
          </button>
          {expanded && (
            <div className="flex flex-col gap-3">
              {rest.map((entry) => (
                <EntryRow key={entry.id} brandId={brandId} entry={entry} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
