"use client";

import { useState } from "react";

type Entry = {
  id: string;
  type: string;
  content: string | null;
  date: string;
};

function EntryRow({ entry }: { entry: Entry }) {
  return (
    <div className="rounded-xl bg-soft px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">{entry.type}</span>
        <span className="text-xs font-light text-ink/50">
          {new Date(entry.date).toLocaleDateString("fr-FR")}
        </span>
      </div>
      {entry.content && <p className="mt-1 text-sm font-light text-ink/70">{entry.content}</p>}
    </div>
  );
}

export default function HistoryPanel({ entries }: { entries: Entry[] }) {
  const [expanded, setExpanded] = useState(false);

  if (entries.length === 0) {
    return <p className="text-sm font-light text-ink/50">Aucun contact enregistré.</p>;
  }

  const [latest, ...rest] = entries;

  return (
    <div className="flex flex-col gap-3">
      <EntryRow entry={latest} />

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
                <EntryRow key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
