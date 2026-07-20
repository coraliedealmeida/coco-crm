"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ServiceType } from "@prisma/client";
import { serviceTypeOptions } from "@/lib/serviceTypes";

export default function NewProjectButton({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serviceType, setServiceType] = useState<ServiceType>(serviceTypeOptions[0].value);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    setSaving(true);
    const res = await fetch(`/api/clients/${clientId}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceType, name }),
    });
    const created = await res.json();
    setSaving(false);
    setOpen(false);
    router.push(`/clients/${clientId}/projects/${created.id}`);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-fit rounded-xl bg-cta px-5 py-3 text-sm font-semibold text-ink transition hover:opacity-90"
      >
        + Nouveau projet
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-soft/60 p-4">
      <select
        value={serviceType}
        onChange={(e) => setServiceType(e.target.value as ServiceType)}
        className="rounded-xl border border-accent-light bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
      >
        {serviceTypeOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nom du projet (optionnel, ex : École - Juin)"
        className="min-w-[14rem] flex-1 rounded-xl border border-accent-light bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
      />
      <button
        onClick={handleCreate}
        disabled={saving}
        className="rounded-xl bg-cta px-5 py-3 text-sm font-semibold text-ink transition hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Création..." : "Créer le projet"}
      </button>
      <button onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-sm text-ink/50 hover:text-ink">
        Annuler
      </button>
    </div>
  );
}
