"use client";

import { useState } from "react";

type Option = { id: string; label: string };

export default function OptionsManager({
  title,
  endpoint,
  initial,
}: {
  title: string;
  endpoint: string;
  initial: Option[];
}) {
  const [options, setOptions] = useState(initial);
  const [newValue, setNewValue] = useState("");

  async function handleAdd() {
    const trimmed = newValue.trim();
    if (!trimmed || options.some((o) => o.label === trimmed)) return;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: trimmed }),
    });
    const created = await res.json();
    setOptions((prev) => [...prev, created]);
    setNewValue("");
  }

  async function handleDelete(id: string) {
    setOptions((prev) => prev.filter((o) => o.id !== id));
    await fetch(`${endpoint}/${id}`, { method: "DELETE" });
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-soft">
      <h2 className="mb-4 font-sans text-base font-extrabold text-ink">{title}</h2>
      <div className="mb-3 flex flex-wrap gap-2">
        {options.map((opt) => (
          <span
            key={opt.id}
            className="flex items-center gap-1.5 rounded-full bg-soft px-3 py-1.5 text-sm text-ink"
          >
            {opt.label}
            <button
              onClick={() => handleDelete(opt.id)}
              aria-label={`Supprimer ${opt.label}`}
              className="text-ink/40 hover:text-red-500"
            >
              ×
            </button>
          </span>
        ))}
        {options.length === 0 && <p className="text-sm font-light text-ink/40">Aucune valeur.</p>}
      </div>
      <div className="flex gap-2">
        <input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="Nouvelle valeur"
          className="flex-1 rounded-xl border border-accent-light bg-soft px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
        />
        <button
          onClick={handleAdd}
          className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Ajouter
        </button>
      </div>
    </div>
  );
}
