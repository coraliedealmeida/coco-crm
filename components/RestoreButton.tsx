"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";
import type { TrashModel } from "@/lib/trash";

export default function RestoreButton({ model, id }: { model: TrashModel; id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleRestore() {
    setBusy(true);
    const res = await apiFetch("/api/trash/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, id }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      onClick={handleRestore}
      disabled={busy}
      className="rounded-xl bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
    >
      {busy ? "Restauration…" : "Restaurer"}
    </button>
  );
}
