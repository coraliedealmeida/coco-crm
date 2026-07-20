"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "@/components/DatePicker";
import CreatableSelect from "@/components/CreatableSelect";

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

type Path = "routine" | "contact";

export default function BrandForm({ initial }: { initial?: Partial<Brand> & { id?: string } }) {
  const router = useRouter();
  const [brand, setBrand] = useState<Brand>({ ...emptyBrand, ...initial });
  const [sectors, setSectors] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [path, setPath] = useState<Path>("routine");
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
      ? path === "routine"
        ? { ...brand, source: "", pipelineStatus: "ROUTINE_ENGAGEMENT" }
        : {
            ...brand,
            platform: "BOTH" as const,
            engagementStartDate: new Date().toISOString(),
            pipelineStatus: "EN_DISCUSSION",
          }
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
      <Field label="Nom de la marque">
        <input
          required
          value={brand.name}
          onChange={(e) => setBrand({ ...brand, name: e.target.value })}
          className="w-full rounded-xl border border-accent-light bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-accent"
        />
      </Field>

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

      {isNew ? (
        <div className="rounded-2xl bg-soft/60 p-4">
          <div className="flex gap-1 rounded-xl bg-white p-1">
            <button
              type="button"
              onClick={() => setPath("routine")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                path === "routine" ? "bg-accent text-white" : "text-ink/60 hover:bg-soft"
              }`}
            >
              Routine d&apos;engagement
            </button>
            <button
              type="button"
              onClick={() => setPath("contact")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                path === "contact" ? "bg-accent text-white" : "text-ink/60 hover:bg-soft"
              }`}
            >
              Prise de contact
            </button>
          </div>

          {path === "routine" ? (
            <div className="mt-4 flex flex-col gap-4">
              <Field label="Plateforme cible">
                <select
                  value={brand.platform}
                  onChange={(e) => setBrand({ ...brand, platform: e.target.value as Brand["platform"] })}
                  className="w-full rounded-xl border border-accent-light bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                >
                  <option value="LINKEDIN">LinkedIn</option>
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="BOTH">Les deux</option>
                </select>
              </Field>
              <Field label="Date de début de la routine d'engagement">
                <DatePicker
                  value={brand.engagementStartDate ? new Date(brand.engagementStartDate) : null}
                  onChange={(d) => setBrand({ ...brand, engagementStartDate: d ? d.toISOString() : null })}
                />
              </Field>
            </div>
          ) : (
            <div className="mt-4">
              <p className="mb-2 text-xs font-light text-ink/50">
                La marque t&apos;a contactée, ou tu l&apos;as contactée hors réseaux sociaux.
              </p>
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
            </div>
          )}
        </div>
      ) : (
        <>
          <Field label="Plateforme cible">
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
        </>
      )}

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
