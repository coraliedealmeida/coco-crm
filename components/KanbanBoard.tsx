"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { PipelineStatus } from "@prisma/client";
import {
  macroGroups,
  macroGroupForStatus,
  pipelineColumns,
  platformBadge,
  avatarColor,
  initials,
  statusLabel,
} from "@/lib/pipeline";
import { countBusinessDays } from "@/lib/business-days";

type Brand = {
  id: string;
  name: string;
  platform: "LINKEDIN" | "INSTAGRAM" | "BOTH";
  pipelineStatus: PipelineStatus;
  lastContactDate: string | null;
  nextActionDate: string | null;
  engagementStartDate: string;
};

export default function KanbanBoard({ brands: initialBrands }: { brands: Brand[] }) {
  const [brands, setBrands] = useState(initialBrands);
  const router = useRouter();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function updateStatus(brandId: string, newStatus: PipelineStatus) {
    setBrands((prev) =>
      prev.map((b) => (b.id === brandId ? { ...b, pipelineStatus: newStatus } : b))
    );
    await fetch(`/api/brands/${brandId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pipelineStatus: newStatus }),
    });
    router.refresh();
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const brandId = active.id as string;
    const targetGroupId = over.id as string;

    const brand = brands.find((b) => b.id === brandId);
    if (!brand) return;

    const currentGroup = macroGroupForStatus(brand.pipelineStatus);
    if (currentGroup.id === targetGroupId) return;

    const targetGroup = macroGroups.find((g) => g.id === targetGroupId);
    if (!targetGroup) return;

    await updateStatus(brandId, targetGroup.statuses[0]);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {macroGroups.map((group) => (
          <Column
            key={group.id}
            group={group}
            brands={brands.filter((b) => macroGroupForStatus(b.pipelineStatus).id === group.id)}
            onStatusChange={updateStatus}
          />
        ))}
      </div>
    </DndContext>
  );
}

function Column({
  group,
  brands,
  onStatusChange,
}: {
  group: { id: string; label: string; color: string };
  brands: Brand[];
  onStatusChange: (brandId: string, status: PipelineStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: group.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-80 shrink-0 flex-col gap-3 rounded-2xl p-3 transition ${
        isOver ? "bg-accent-light/30 ring-2 ring-accent" : "bg-soft/60"
      }`}
    >
      <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 shadow-softer">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: group.color }} />
        <h3 className="text-sm font-extrabold text-ink">{group.label}</h3>
        <span className="ml-auto rounded-full bg-soft px-2 py-0.5 text-xs font-semibold text-ink/50">
          {brands.length}
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {brands.map((b) => (
          <Card key={b.id} brand={b} groupColor={group.color} onStatusChange={onStatusChange} />
        ))}
      </div>
    </div>
  );
}

function Card({
  brand,
  groupColor,
  onStatusChange,
}: {
  brand: Brand;
  groupColor: string;
  onStatusChange: (brandId: string, status: PipelineStatus) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: brand.id });
  const days = countBusinessDays(new Date(brand.engagementStartDate), new Date());
  const badge = platformBadge[brand.platform];

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl bg-white p-4 shadow-md transition hover:shadow-lg ${
        isDragging ? "rotate-1 opacity-80 shadow-xl" : ""
      }`}
    >
      <div {...listeners} {...attributes} className="mb-3 flex cursor-grab items-center gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white"
          style={{ backgroundColor: avatarColor(brand.name) }}
        >
          {initials(brand.name)}
        </div>
        <div className="flex-1 overflow-hidden">
          <Link href={`/marques/${brand.id}`} className="truncate text-sm font-extrabold text-ink hover:underline">
            {brand.name}
          </Link>
          <span
            className="mt-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ backgroundColor: badge.bg, color: badge.text }}
          >
            {badge.icon}
          </span>
        </div>
      </div>

      <select
        value={brand.pipelineStatus}
        onChange={(e) => onStatusChange(brand.id, e.target.value as PipelineStatus)}
        onPointerDown={(e) => e.stopPropagation()}
        className="mb-2.5 w-full rounded-lg border border-accent-light bg-soft px-2.5 py-1.5 text-xs font-semibold text-ink outline-none focus:border-accent"
      >
        {pipelineColumns.map((c) => (
          <option key={c.status} value={c.status}>
            {statusLabel(c.status)}
          </option>
        ))}
      </select>

      <div className="flex flex-col gap-1 border-t border-soft pt-2.5 text-xs font-light text-ink/60">
        {brand.lastContactDate && (
          <p>Dernier contact : {new Date(brand.lastContactDate).toLocaleDateString("fr-FR")}</p>
        )}
        {brand.nextActionDate && (
          <p>Prochaine action : {new Date(brand.nextActionDate).toLocaleDateString("fr-FR")}</p>
        )}
      </div>

      <div
        className="mt-3 flex w-fit items-center gap-1.5 rounded-full bg-soft px-2.5 py-1 text-xs font-semibold"
        style={{ color: groupColor === "#CCFF00" ? "#1D1C1F" : groupColor }}
      >
        <span aria-hidden>🔥</span>
        {days}j d&apos;engagement
      </div>
    </div>
  );
}
