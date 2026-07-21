"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "@/components/DatePicker";

type Reminder = {
  id: string;
  date: string;
  label: string;
  completed: boolean;
};

export default function RemindersPanel({ createUrl, reminders }: { createUrl: string; reminders: Reminder[] }) {
  const router = useRouter();
  const [date, setDate] = useState<Date | null>(null);
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const upcoming = reminders
    .filter((r) => !r.completed)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  async function handleAdd() {
    if (!date || !label.trim()) return;
    setSaving(true);
    await fetch(createUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: date.toISOString(), label: label.trim() }),
    });
    setSaving(false);
    setDate(null);
    setLabel("");
    router.refresh();
  }

  async function handleComplete(id: string) {
    await fetch(`/api/reminders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    });
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce rappel ?")) return;
    await fetch(`/api/reminders/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-soft">
      <h2 className="mb-4 flex items-center gap-2 font-sans text-base font-extrabold text-ink">
        <span>📌</span> Rappels programmés
      </h2>

      <div className="mb-4 flex flex-col gap-3">
        {upcoming.length === 0 && <p className="text-sm font-light text-ink/40">Aucun rappel programmé.</p>}
        {upcoming.map((r) => {
          const overdue = new Date(r.date) <= new Date();
          return (
            <div
              key={r.id}
              className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                overdue ? "bg-cta/20" : "bg-soft"
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-ink">{r.label}</p>
                <p className="text-xs font-light text-ink/50">
                  {new Date(r.date).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleComplete(r.id)}
                  className="text-xs font-semibold text-accent hover:underline"
                >
                  ✓ Fait
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="text-ink/30 hover:text-red-500"
                  aria-label="Supprimer ce rappel"
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 border-t border-soft pt-4">
        <DatePicker value={date} onChange={setDate} placeholder="Date du rappel" />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="ex: Envoyer devis au retour de vacances"
          className="w-full rounded-xl border border-accent-light bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-accent"
        />
        <button
          onClick={handleAdd}
          disabled={saving || !date || !label.trim()}
          className="w-fit rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Ajout..." : "Programmer ce rappel"}
        </button>
      </div>
    </div>
  );
}
