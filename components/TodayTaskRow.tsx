"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DueBadge from "@/components/DueBadge";
import type { DueBadge as DueBadgeData } from "@/lib/dueStatus";

export default function TodayTaskRow({
  id,
  label,
  dueBadge,
}: {
  id: string;
  label: string;
  dueBadge: DueBadgeData | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleComplete() {
    setLoading(true);
    await fetch(`/api/dashboard-tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    });
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2 rounded-xl bg-soft px-3 py-2.5">
      <button
        onClick={handleComplete}
        disabled={loading}
        aria-label="Marquer comme fait"
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-ink/30 transition hover:border-accent disabled:opacity-50"
      />
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">📝 {label}</span>
      <DueBadge badge={dueBadge} compact />
    </div>
  );
}
