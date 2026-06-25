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
import { pipelineColumns, platformLabel } from "@/lib/pipeline";
import { countBusinessDays } from "@/lib/business-days";

type Brand = {
  id: string;
  name: string;
  platform: "LINKEDIN" | "INSTAGRAM" | "BOTH";
  pipelineStatus: string;
  lastContactDate: string | null;
  nextActionDate: string | null;
  engagementStartDate: string;
};

export default function KanbanBoard({ brands: initialBrands }: { brands: Brand[] }) {
  const [brands, setBrands] = useState(initialBrands);
  const router = useRouter();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const brandId = active.id as string;
    const newStatus = over.id as string;

    const brand = brands.find((b) => b.id === brandId);
    if (!brand || brand.pipelineStatus === newStatus) return;

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

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {pipelineColumns.map((col) => (
          <Column
            key={col.status}
            status={col.status}
            label={col.label}
            color={col.color}
            brands={brands.filter((b) => b.pipelineStatus === col.status)}
          />
        ))}
      </div>
    </DndContext>
  );
}

function Column({
  status,
  label,
  color,
  brands,
}: {
  status: string;
  label: string;
  color: string;
  brands: Brand[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-64 shrink-0 flex-col gap-3 rounded-2xl p-3 ${isOver ? "bg-accent-light/30" : "bg-white"}`}
    >
      <div className="flex items-center gap-2 px-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        <h3 className="text-sm font-extrabold text-ink">{label}</h3>
        <span className="ml-auto text-xs font-light text-ink/40">{brands.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {brands.map((b) => (
          <Card key={b.id} brand={b} color={color} />
        ))}
      </div>
    </div>
  );
}

function Card({ brand, color }: { brand: Brand; color: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: brand.id });
  const days = countBusinessDays(new Date(brand.engagementStartDate), new Date());

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={`cursor-grab rounded-xl border-l-4 bg-soft p-3 shadow-sm ${isDragging ? "opacity-70" : ""}`}
    >
      <Link href={`/marques/${brand.id}`} className="block" style={{ borderColor: color }}>
        <p className="text-sm font-semibold text-ink" style={{ borderLeftColor: color }}>
          {brand.name}
        </p>
        <p className="text-xs font-light text-ink/60">{platformLabel[brand.platform]}</p>
        {brand.lastContactDate && (
          <p className="mt-1 text-xs font-light text-ink/50">
            Dernier contact : {new Date(brand.lastContactDate).toLocaleDateString("fr-FR")}
          </p>
        )}
        {brand.nextActionDate && (
          <p className="text-xs font-light text-ink/50">
            Prochaine action : {new Date(brand.nextActionDate).toLocaleDateString("fr-FR")}
          </p>
        )}
        <p className="mt-1 text-xs font-semibold text-accent">🔥 {days}j d&apos;engagement</p>
      </Link>
    </div>
  );
}
