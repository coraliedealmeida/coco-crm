"use client";

import { useState } from "react";

export default function CreatableSelect({
  options,
  value,
  onChange,
  onCreate,
  label,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  onCreate: (value: string) => Promise<void>;
  label: string;
}) {
  const [adding, setAdding] = useState(false);
  const [newValue, setNewValue] = useState("");

  async function handleAdd() {
    const trimmed = newValue.trim();
    if (!trimmed) return;
    await onCreate(trimmed);
    onChange(trimmed);
    setNewValue("");
    setAdding(false);
  }

  if (adding) {
    return (
      <div className="flex gap-2">
        <input
          autoFocus
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder={`Nouveau ${label.toLowerCase()}`}
          className="flex-1 rounded-xl border border-accent-light bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white"
        >
          Ajouter
        </button>
        <button
          type="button"
          onClick={() => setAdding(false)}
          className="rounded-xl px-3 py-3 text-sm text-ink/50"
        >
          Annuler
        </button>
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => {
        if (e.target.value === "__add__") {
          setAdding(true);
        } else {
          onChange(e.target.value);
        }
      }}
      className="w-full rounded-xl border border-accent-light bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-accent"
    >
      <option value="" disabled>
        Choisir un {label.toLowerCase()}
      </option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
      <option value="__add__">+ Ajouter une valeur</option>
    </select>
  );
}
