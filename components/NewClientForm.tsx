"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CreatableSelect from "@/components/CreatableSelect";

type Client = {
  name: string;
  emoji: string | null;
  sector: string;
  contactName: string;
  contactRole: string;
  notes: string;
};

const emptyClient: Client = {
  name: "",
  emoji: null,
  sector: "",
  contactName: "",
  contactRole: "",
  notes: "",
};

export default function NewClientForm() {
  const router = useRouter();
  const [client, setClient] = useState<Client>(emptyClient);
  const [sectors, setSectors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/options/sectors")
      .then((r) => r.json())
      .then((data) => setSectors(data.map((d: { label: string }) => d.label)));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const res = await fetch("/api/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...client,
        platform: "BOTH",
        source: "",
        acquisitionPath: "DIRECT",
        engagementStartDate: new Date().toISOString(),
        pipelineStatus: "DEVIS_ACCEPTE",
      }),
    });

    setSaving(false);

    if (res.ok) {
      const data = await res.json();
      router.push(`/marques/${data.id}?from=projets`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-5">
      <p className="text-sm font-light text-ink/50">
        Pour un client existant ou ancien (école, jury...) sans historique de prospection à
        renseigner. Une fois créé, ajoute son ou ses projets directement depuis sa fiche.
      </p>

      <Field label="Nom du client">
        <input
          required
          value={client.name}
          onChange={(e) => setClient({ ...client, name: e.target.value })}
          className="w-full rounded-xl border border-accent-light bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-accent"
        />
      </Field>

      <Field label="Emoji">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-soft text-xl">
            {client.emoji || <span className="text-xs font-semibold text-ink/40">Aa</span>}
          </div>
          <input
            value={client.emoji ?? ""}
            onChange={(e) =>
              setClient({ ...client, emoji: e.target.value.trim() ? [...e.target.value.trim()][0] : null })
            }
            placeholder="Colle ou tape un emoji (ex : 🎓)"
            className="flex-1 rounded-xl border border-accent-light bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-accent"
          />
        </div>
      </Field>

      <Field label="Secteur">
        <CreatableSelect
          label="Secteur"
          options={sectors}
          value={client.sector}
          onChange={(v) => setClient({ ...client, sector: v })}
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
          value={client.contactName}
          onChange={(e) => setClient({ ...client, contactName: e.target.value })}
          className="w-full rounded-xl border border-accent-light bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-accent"
        />
      </Field>

      <Field label="Interlocuteur (poste)">
        <input
          value={client.contactRole}
          onChange={(e) => setClient({ ...client, contactRole: e.target.value })}
          className="w-full rounded-xl border border-accent-light bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-accent"
        />
      </Field>

      <Field label="Notes">
        <textarea
          value={client.notes}
          onChange={(e) => setClient({ ...client, notes: e.target.value })}
          rows={4}
          className="w-full rounded-xl border border-accent-light bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-accent"
        />
      </Field>

      <button
        type="submit"
        disabled={saving}
        className="mt-2 w-fit rounded-xl bg-cta px-6 py-3 font-semibold text-ink transition hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Création..." : "Créer le client"}
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
