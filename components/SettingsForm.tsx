"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Settings = {
  daysBeforeGreenLight: number;
  daysBeforeRelance1: number;
  daysBeforeRelance2: number;
  daysBeforeDevisRelance1: number;
  daysBeforeDevisRelance2: number;
  daysBeforeFactureRelance1: number;
  daysBeforeFactureRelance2: number;
  daysBetweenEngagements: number;
  emailNotifications: boolean;
};

type NumKey = Exclude<keyof Settings, "emailNotifications">;

const groups: { title: string; fields: { key: NumKey; label: string }[] }[] = [
  {
    title: "Prospection",
    fields: [
      { key: "daysBeforeGreenLight", label: "Feu vert DM" },
      { key: "daysBeforeRelance1", label: "Relance 1" },
      { key: "daysBeforeRelance2", label: "Relance 2" },
      { key: "daysBetweenEngagements", label: "Entre 2 passages en routine" },
    ],
  },
  {
    title: "Devis",
    fields: [
      { key: "daysBeforeDevisRelance1", label: "Relance 1" },
      { key: "daysBeforeDevisRelance2", label: "Relance 2" },
    ],
  },
  {
    title: "Factures",
    fields: [
      { key: "daysBeforeFactureRelance1", label: "Relance 1" },
      { key: "daysBeforeFactureRelance2", label: "Relance 2" },
    ],
  },
];

export default function SettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [settings, setSettings] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 rounded-3xl bg-white p-6 shadow-soft">
      <p className="text-sm font-light text-ink/50">Délais exprimés en jours ouvrés (hors week-ends).</p>

      {groups.map((group) => (
        <div key={group.title}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/40">{group.title}</p>
          <div className="flex flex-col divide-y divide-soft rounded-2xl bg-soft/50">
            {group.fields.map((f) => (
              <Stepper
                key={f.key}
                label={f.label}
                value={settings[f.key]}
                onChange={(v) => setSettings({ ...settings, [f.key]: v })}
              />
            ))}
          </div>
        </div>
      ))}

      <Toggle
        label="Notifications email pour les relances du jour"
        checked={settings.emailNotifications}
        onChange={(v) => setSettings({ ...settings, emailNotifications: v })}
      />

      <button
        type="submit"
        disabled={saving}
        className="w-fit rounded-xl bg-cta px-6 py-3 font-semibold text-ink transition hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Enregistrement..." : saved ? "Enregistré ✓" : "Enregistrer"}
      </button>
    </form>
  );
}

function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-ink shadow-softer hover:bg-accent-light/40"
        >
          −
        </button>
        <span className="w-12 text-center font-sans text-sm font-extrabold text-accent">J{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-ink shadow-softer hover:bg-accent-light/40"
        >
          +
        </button>
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-soft px-4 py-3">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-accent" : "bg-ink/20"}`}
      >
        <span
          className={`block h-5 w-5 translate-x-0.5 rounded-full bg-white transition ${checked ? "translate-x-5" : ""}`}
        />
      </button>
    </div>
  );
}
