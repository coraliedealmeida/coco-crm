"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  statusLabel,
  showsEngagementDays,
} from "@/lib/pipeline";
import { countBusinessDays } from "@/lib/business-days";
import BrandCard from "@/components/BrandCard";

type Brand = {
  id: string;
  name: string;
  emoji: string | null;
  platform: "LINKEDIN" | "INSTAGRAM" | "BOTH";
  acquisitionPath: "ROUTINE" | "CONTACT" | "DIRECT" | null;
  pipelineStatus: PipelineStatus;
  lastContactDate: string | null;
  nextActionDate: string | null;
  engagementStartDate: string;
  potentialRevenue: number | null;
  updatedAt: string;
};

const RECENT_WIN_DAYS = 30;

function isRecentWin(brand: Brand): boolean {
  if (brand.pipelineStatus !== "DEVIS_ACCEPTE") return false;
  const daysSinceUpdate = (Date.now() - new Date(brand.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceUpdate <= RECENT_WIN_DAYS;
}

function splitGroupBrands(group: { id: string }, brands: Brand[]) {
  const groupBrands = brands.filter((b) => macroGroupForStatus(b.pipelineStatus).id === group.id);
  const isClosing = group.id === "CLOSING";
  const visible = isClosing ? groupBrands.filter(isRecentWin) : groupBrands;
  const collapsed = isClosing ? groupBrands.filter((b) => !isRecentWin(b)) : [];
  return { visible, collapsed };
}

export default function KanbanBoard({
  brands: initialBrands,
  greenLightThreshold,
}: {
  brands: Brand[];
  greenLightThreshold: number;
}) {
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
    <>
      <div className="flex flex-col gap-3 md:hidden">
        {macroGroups.map((group) => {
          const { visible, collapsed } = splitGroupBrands(group, brands);
          return (
            <AccordionSection
              key={group.id}
              group={group}
              visibleBrands={visible}
              collapsedBrands={collapsed}
              greenLightThreshold={greenLightThreshold}
              onStatusChange={updateStatus}
            />
          );
        })}
      </div>

      <div className="hidden md:block">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {macroGroups.map((group) => {
              const { visible, collapsed } = splitGroupBrands(group, brands);
              return (
                <Column
                  key={group.id}
                  group={group}
                  visibleBrands={visible}
                  collapsedBrands={collapsed}
                  greenLightThreshold={greenLightThreshold}
                  onStatusChange={updateStatus}
                />
              );
            })}
          </div>
        </DndContext>
      </div>
    </>
  );
}

function Column({
  group,
  visibleBrands,
  collapsedBrands,
  greenLightThreshold,
  onStatusChange,
}: {
  group: { id: string; label: string; color: string };
  visibleBrands: Brand[];
  collapsedBrands: Brand[];
  greenLightThreshold: number;
  onStatusChange: (brandId: string, status: PipelineStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: group.id });
  const [showCollapsed, setShowCollapsed] = useState(false);

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
          {visibleBrands.length + collapsedBrands.length}
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {visibleBrands.map((b) => (
          <DraggableCard
            key={b.id}
            brand={b}
            groupColor={group.color}
            greenLightThreshold={greenLightThreshold}
            onStatusChange={onStatusChange}
          />
        ))}

        {collapsedBrands.length > 0 && (
          <>
            <button
              onClick={() => setShowCollapsed((v) => !v)}
              className="w-fit text-xs font-semibold text-ink/50 hover:text-accent hover:underline"
            >
              {showCollapsed
                ? "Réduire"
                : `Voir les marques ghostées/archivées/anciennes (${collapsedBrands.length})`}
            </button>
            {showCollapsed &&
              collapsedBrands.map((b) => (
                <DraggableCard
                  key={b.id}
                  brand={b}
                  groupColor={group.color}
                  greenLightThreshold={greenLightThreshold}
                  onStatusChange={onStatusChange}
                />
              ))}
          </>
        )}
      </div>
    </div>
  );
}

function AccordionSection({
  group,
  visibleBrands,
  collapsedBrands,
  greenLightThreshold,
  onStatusChange,
}: {
  group: { id: string; label: string; color: string };
  visibleBrands: Brand[];
  collapsedBrands: Brand[];
  greenLightThreshold: number;
  onStatusChange: (brandId: string, status: PipelineStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const [showCollapsed, setShowCollapsed] = useState(false);
  const total = visibleBrands.length + collapsedBrands.length;

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-softer">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-3.5 text-left"
      >
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: group.color }} />
        <span className="text-sm font-extrabold text-ink">{group.label}</span>
        <span className="ml-auto rounded-full bg-soft px-2 py-0.5 text-xs font-semibold text-ink/50">
          {total}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`shrink-0 text-ink/40 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="flex flex-col gap-2.5 border-t border-soft p-3">
          {visibleBrands.map((b) => (
            <CardBody
              key={b.id}
              brand={b}
              groupColor={group.color}
              greenLightThreshold={greenLightThreshold}
              onStatusChange={onStatusChange}
            />
          ))}
          {total === 0 && <p className="px-1 py-1 text-xs font-light text-ink/30">Rien ici.</p>}

          {collapsedBrands.length > 0 && (
            <>
              <button
                onClick={() => setShowCollapsed((v) => !v)}
                className="w-fit text-xs font-semibold text-ink/50 hover:text-accent hover:underline"
              >
                {showCollapsed
                  ? "Réduire"
                  : `Voir les marques ghostées/archivées/anciennes (${collapsedBrands.length})`}
              </button>
              {showCollapsed &&
                collapsedBrands.map((b) => (
                  <CardBody
                    key={b.id}
                    brand={b}
                    groupColor={group.color}
                    greenLightThreshold={greenLightThreshold}
                    onStatusChange={onStatusChange}
                  />
                ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CardBody({
  brand,
  groupColor,
  greenLightThreshold,
  onStatusChange,
}: {
  brand: Brand;
  groupColor: string;
  greenLightThreshold: number;
  onStatusChange: (brandId: string, status: PipelineStatus) => void;
}) {
  const days = countBusinessDays(new Date(brand.engagementStartDate), new Date());

  return (
    <BrandCard
      brand={{
        ...brand,
        engagementDays: showsEngagementDays(brand.pipelineStatus, days, greenLightThreshold) ? days : null,
      }}
      engagementColor={groupColor}
      statusContent={
        <select
          value={brand.pipelineStatus}
          onChange={(e) => onStatusChange(brand.id, e.target.value as PipelineStatus)}
          onPointerDown={(e) => e.stopPropagation()}
          className="w-full rounded-lg border border-accent-light bg-soft px-2.5 py-1.5 text-xs font-semibold text-ink outline-none focus:border-accent"
        >
          {pipelineColumns.map((c) => (
            <option key={c.status} value={c.status}>
              {statusLabel(c.status)}
            </option>
          ))}
        </select>
      }
      footer={
        <div className="mb-2.5 flex flex-col gap-1 border-t border-soft pt-2.5 text-xs font-light text-ink/60">
          {brand.lastContactDate && (
            <p>Dernier contact : {new Date(brand.lastContactDate).toLocaleDateString("fr-FR")}</p>
          )}
          {brand.nextActionDate && (
            <p>Prochaine action : {new Date(brand.nextActionDate).toLocaleDateString("fr-FR")}</p>
          )}
          {!brand.lastContactDate && !brand.nextActionDate && <p className="text-ink/30">⠿ Glisser ici</p>}
        </div>
      }
    />
  );
}

function DraggableCard({
  brand,
  groupColor,
  greenLightThreshold,
  onStatusChange,
}: {
  brand: Brand;
  groupColor: string;
  greenLightThreshold: number;
  onStatusChange: (brandId: string, status: PipelineStatus) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: brand.id });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab ${isDragging ? "rotate-1 opacity-80" : ""}`}
    >
      <CardBody
        brand={brand}
        groupColor={groupColor}
        greenLightThreshold={greenLightThreshold}
        onStatusChange={onStatusChange}
      />
    </div>
  );
}
