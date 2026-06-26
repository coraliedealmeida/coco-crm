"use client";

import { useState } from "react";

export default function OptionsManager({
  title,
  endpoint,
  initial,
}: {
  title: string;
  endpoint: string;
  initial: string[];
}) {
  const [options, setOptions] = useState(initial);
  const [newValue, setNewValue] = useState("");

  async function handleAdd() {
    const trimmed = newValue.trim();
    if (!trimmed || options.includes(trimmed)) return;
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: trimmed }),
    });
    setOptions((prev) => [...prev, trimmed]);
    setNewValue("");
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-soft">
      <h2 className="mb-4 font-sans text-base font-extrabold text-ink">{title}</h2>
      <div className="mb-3 flex flex-wrap gap-2">
        {options.map((opt) => (
          <span key={opt} className="rounded-full bg-soft px-3 py-1.5 text-sm text-ink">
            {opt}
          </span>
        ))}
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
