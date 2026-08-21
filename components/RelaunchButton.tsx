"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { pipelineColumns } from "@/lib/pipeline";
import type { PipelineStatus } from "@prisma/client";

const RELAUNCH_STATUSES: Record<"brand" | "quoteRequest", PipelineStatus[]> = {
  brand: ["ROUTINE_ENGAGEMENT", "PREMIER_DM", "RELANCE_1", "RELANCE_2"],
  quoteRequest: ["DEVIS_A_FAIRE", "DEVIS_ENVOYE", "RELANCE_DEVIS_1", "RELANCE_DEVIS_2"],
};

export default function RelaunchButton({ id, kind = "brand" }: { id: string; kind?: "brand" | "quoteRequest" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleRelaunch(status: PipelineStatus) {
    setSaving(true);
    const endpoint = kind === "brand" ? `/api/brands/${id}` : `/api/quote-requests/${id}`;
    const body = kind === "brand" ? { pipelineStatus: status, reconsiderDate: null } : { status, reconsiderDate: null };
    await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
      >
        Relancer →
      </button>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {RELAUNCH_STATUSES[kind].map((s) => (
        <button
          key={s}
          onClick={() => handleRelaunch(s)}
          disabled={saving}
          className="rounded-xl border border-accent-light bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-accent-light/30 disabled:opacity-50"
        >
          {pipelineColumns.find((c) => c.status === s)?.label ?? s}
        </button>
      ))}
      <button
        onClick={() => setOpen(false)}
        className="rounded-xl px-3 py-1.5 text-xs font-semibold text-ink/40 hover:text-ink"
      >
        ✕
      </button>
    </div>
  );
}
