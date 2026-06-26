"use client";

import { useRouter } from "next/navigation";
import { PipelineStatus } from "@prisma/client";
import { pipelineColumns, statusLabel } from "@/lib/pipeline";

export default function StatusSelector({
  brandId,
  status,
}: {
  brandId: string;
  status: PipelineStatus;
}) {
  const router = useRouter();

  async function handleChange(newStatus: PipelineStatus) {
    await fetch(`/api/brands/${brandId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pipelineStatus: newStatus }),
    });
    router.refresh();
  }

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value as PipelineStatus)}
      className="mt-1 w-full rounded-md border-none bg-transparent text-sm font-semibold text-ink outline-none"
    >
      {pipelineColumns.map((c) => (
        <option key={c.status} value={c.status}>
          {statusLabel(c.status)}
        </option>
      ))}
    </select>
  );
}
