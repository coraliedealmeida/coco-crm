"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PipelineStatus } from "@prisma/client";
import DatePicker from "@/components/DatePicker";
import CreatableSelect from "@/components/CreatableSelect";
import { pipelineColumns } from "@/lib/pipeline";

type Brand = {
  id?: string;
  name: string;
  emoji: string | null;
  platform: "LINKEDIN" | "INSTAGRAM" | "BOTH";
  sector: string;
  source: string;
  notes: string;
  engagementStartDate: string | null;
  contactName: string;
  contactRole: string;
  potentialRevenue: number | null;
};

const emptyBrand: Brand = {
  name: "",
  emoji: null,
  platform: "LINKEDIN",
  sector: "",
  source: "",
  notes: "",
  engagementStartDate: new Date().toISOString(),
  contactName: "",
  contactRole: "",
  potentialRevenue: null,
};

// Statuts de départ possibles quand on n'engage pas de routine (les plus courants).
const START_STATUSES: PipelineStatus[] = ["PREMIER_DM", "EN_DISCUSSION", "APPEL_PREVU", "DEVIS_A_FAIRE"];

export default function BrandForm({ initial }: { initial?: Partial<Brand> & { id?: string } }) {
  const router = useRouter();
  const [brand, setBrand] = useState<Brand>({ ...emptyBrand, ...initial });
  const [sectors, setSectors] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [withRoutine, setWithRoutine] = useState(true);
  const [startStatus, setStartStatus] = useState<PipelineStatus>("PREMIER_DM");
  const [saving, setSaving] = useState(false);

  const isNew = !initial?.id;

  useEffect(() => {
    fetch("/api/options/sectors")
      .then((r) => r.json())
      .then((data) => setSectors(data.map((d: { label: string }) => d.label)));
    fetch("/api/options/sources")
      .then((r) => r.json())
      .then((data) => setSources(data.map((d: { label: string }) => d.label)));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const method = initial?.id ? "PATCH" : "POST";
    const url = initial?.id ? `/api/brands/${initial.id}` : "/api/brands";
    const payload = isNew
      ? { ...brand, pipelineStatus: withRoutine ? "ROUTINE_ENGAGEMENT" : startStatus }
      : brand;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (res.ok) {
      const data = await res.json();
      router.push(`/marques/${data.id}`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-5">
      <Field label="Emoji de la marque">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-soft text-xl">
            {brand.emoji || <span className="text-xs font-semibold text-ink/40">Aa</span>}
          </div>
          <input
            value={brand.emoji ?? ""}
            onChange={(e) => setBrand({ ...brand, emoji: e.target.value.trim() ? [...e.target.value.trim()][0] : null })}
            placeholder="Colle ou tape un emoji (ex : 🐾)"
            className="flex-1 rounded-xl border border-accent-light bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-accent"
          />
        </div>
        <p className="mt-1.5 text-xs font-light text-ink/40">
          Sur Mac : Cmd + Ctrl + Espace ouvre le clavier emoji. Laisse vide pour garder les initiales.
        </p>
      </Field>

      <Field label="Nom de la marque">
        <input
          required
          value={brand.name}
          onChange={(e) => setBrand({ ...brand, name: e.target.value })}
          className="w-full rounded-xl border border-accent-light bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-accent"
        />
      </Field>

      {isNew && (
        <div className="rounded-2xl bg-soft/60 p-4">
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-ink">Démarrer une routine d&apos;engagement</span>
            <button
              type="button"
              onClick={() => setWithRoutine((v) => !v)}
              className={`h-6 w-11 shrink-0 rounded-full transition ${withRoutine ? "bg-accent" : "bg-ink/20"}`}
            >
              <span
                className={`block h-5 w-5 translate-x-0.5 rounded-full bg-white transition ${
                  withRoutine ? "translate-x-5" : ""
                }`}
              />
            </button>
          </label>
          <p className="mt-1.5 text-xs font-light text-ink/50">
            {withRoutine
              ? "Tu vas chercher cette marque : précise la plateforme que tu cibles."
              : "Cette marque t'a déjà contactée : précise la plateforme de contact et le statut de départ."}
          </p>
          {!withRoutine && (
            <div className="mt-3">
              <label className="mb-2 block text-sm font-semibold text-ink">Statut de départ</label>
              <select
                value={startStatus}
                onChange={(e) => setStartStatus(e.target.value as PipelineStatus)}
                className="w-full rounded-xl border border-accent-light bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
              >
                {START_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {pipelineColumns.find((c) => c.status === s)?.label ?? s}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <Field label={isNew && !withRoutine ? "Plateforme de contact" : "Plateforme cible"}>
        <select
          value={brand.platform}
          onChange={(e) => setBrand({ ...brand, platform: e.target.value as Brand["platform"] })}
          className="w-full rounded-xl border border-accent-light bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-accent"
        >
          <option value="LINKEDIN">LinkedIn</option>
          <option value="INSTAGRAM">Instagram</option>
          <option value="BOTH">Les deux</option>
        </select>
      </Field>

      <Field label="Secteur">
        <CreatableSelect
          label="Secteur"
          options={sectors}
          value={brand.sector}
          onChange={(v) => setBrand({ ...brand, sector: v })}
          onCreate={async (v) => {
            await fetch("/api/options/sectors", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ label: v }),
            });
            setSectors((s) => [...s, v]);
          }}
        />
      </Field>

      <Field label="Source">
        <CreatableSelect
          label="Source"
          options={sources}
          value={brand.source}
          onChange={(v) => setBrand({ ...brand, source: v })}
          onCreate={async (v) => {
            await fetch("/api/options/sources", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ label: v }),
            });
            setSources((s) => [...s, v]);
          }}
        />
      </Field>

      <Field label="Date de début d'engagement">
        <DatePicker
          value={brand.engagementStartDate ? new Date(brand.engagementStartDate) : null}
          onChange={(d) => setBrand({ ...brand, engagementStartDate: d ? d.toISOString() : null })}
        />
      </Field>

      <Field label="Interlocuteur (nom)">
        <input
          value={brand.contactName}
          onChange={(e) => setBrand({ ...brand, contactName: e.target.value })}
          className="w-full rounded-xl border border-accent-light bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-accent"
        />
      </Field>

      <Field label="Interlocuteur (poste)">
        <input
          value={brand.contactRole}
          onChange={(e) => setBrand({ ...brand, contactRole: e.target.value })}
          className="w-full rounded-xl border border-accent-light bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-accent"
        />
      </Field>

      <Field label="Notes">
        <textarea
          value={brand.notes}
          onChange={(e) => setBrand({ ...brand, notes: e.target.value })}
          rows={4}
          className="w-full rounded-xl border border-accent-light bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-accent"
        />
      </Field>

      <button
        type="submit"
        disabled={saving}
        className="mt-2 w-fit rounded-xl bg-cta px-6 py-3 font-semibold text-ink transition hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Enregistrement..." : initial?.id ? "Mettre à jour" : "Créer la marque"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-ink">{label}</label>
      {children}
    </div>
  );
}
