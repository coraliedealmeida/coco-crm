"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Settings = {
  daysBeforeGreenLight: number;
  daysBeforeRelance1: number;
  daysBeforeRelance2: number;
  emailNotifications: boolean;
};

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
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-5 rounded-2xl bg-white p-6 shadow-sm">
      <NumberField
        label="Seuil jours ouvrés avant feu vert DM"
        value={settings.daysBeforeGreenLight}
        onChange={(v) => setSettings({ ...settings, daysBeforeGreenLight: v })}
      />
      <NumberField
        label="Délai relance 1 (jours ouvrés)"
        value={settings.daysBeforeRelance1}
        onChange={(v) => setSettings({ ...settings, daysBeforeRelance1: v })}
      />
      <NumberField
        label="Délai relance 2 (jours ouvrés)"
        value={settings.daysBeforeRelance2}
        onChange={(v) => setSettings({ ...settings, daysBeforeRelance2: v })}
      />

      <div className="flex items-center justify-between rounded-xl bg-soft px-4 py-3">
        <span className="text-sm font-semibold text-ink">Notifications email pour les relances du jour</span>
        <button
          type="button"
          onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
          className={`h-6 w-11 rounded-full transition ${settings.emailNotifications ? "bg-accent" : "bg-ink/20"}`}
        >
          <span
            className={`block h-5 w-5 translate-x-0.5 rounded-full bg-white transition ${
              settings.emailNotifications ? "translate-x-5" : ""
            }`}
          />
        </button>
      </div>

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

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-ink">{label}</label>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-xl border border-accent-light bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-accent"
      />
    </div>
  );
}
