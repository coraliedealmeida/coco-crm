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
import { quoteRequestStatuses } from "@/lib/quoteRequests";
import { countBusinessDays } from "@/lib/business-days";
import { dueBadgeFromDate } from "@/lib/dueStatus";
import BrandCard from "@/components/BrandCard";

type Brand = {
  kind: "brand";
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

type QuoteRequestItem = {
  kind: "quoteRequest";
  id: string;
  brandId: string;
  name: string;
  emoji: string | null;
  pipelineStatus: PipelineStatus;
  lastContactDate: string | null;
  nextActionDate: string | null;
  potentialRevenue: number | null;
  badgeLabel: string | null;
  updatedAt: string;
};

type PipelineItem = Brand | QuoteRequestItem;

const RECENT_WIN_DAYS = 30;

function isRecentWin(item: PipelineItem): boolean {
  if (item.pipelineStatus !== "DEVIS_ACCEPTE") return false;
  const daysSinceUpdate = (Date.now() - new Date(item.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceUpdate <= RECENT_WIN_DAYS;
}

function splitGroupItems(group: { id: string }, items: PipelineItem[]) {
  const groupItems = items.filter((it) => macroGroupForStatus(it.pipelineStatus).id === group.id);
  const isClosing = group.id === "CLOSING";
  const visible = isClosing ? groupItems.filter(isRecentWin) : groupItems;
  const collapsed = isClosing ? groupItems.filter((it) => !isRecentWin(it)) : [];
  return { visible, collapsed };
}

/** Statut valide le plus pertinent pour faire atterrir un item dans ce groupe macro. */
function firstStatusForGroup(item: PipelineItem, groupId: string): PipelineStatus | null {
  const targetGroup = macroGroups.find((g) => g.id === groupId);
  if (!targetGroup) return null;
  if (item.kind === "brand") return targetGroup.statuses[0];
  // Une demande de devis n'a de sens que dans les statuts liés au devis : on ignore le
  // déplacement s'il n'y a aucun statut valide dans le groupe cible (ex : "À contacter").
  return quoteRequestStatuses.find((s) => targetGroup.statuses.includes(s)) ?? null;
}

export default function KanbanBoard({
  brands: initialBrands,
  quoteRequests: initialQuoteRequests = [],
  greenLightThreshold,
}: {
  brands: Omit<Brand, "kind">[];
  quoteRequests?: Omit<QuoteRequestItem, "kind">[];
  greenLightThreshold: number;
}) {
  const [items, setItems] = useState<PipelineItem[]>([
    ...initialBrands.map((b) => ({ ...b, kind: "brand" as const })),
    ...initialQuoteRequests.map((q) => ({ ...q, kind: "quoteRequest" as const })),
  ]);
  const router = useRouter();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function updateStatus(item: PipelineItem, newStatus: PipelineStatus) {
    setItems((prev) => prev.map((it) => (it === item ? { ...it, pipelineStatus: newStatus } : it)));
    if (item.kind === "brand") {
      await fetch(`/api/brands/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipelineStatus: newStatus }),
      });
    } else {
      await fetch(`/api/quote-requests/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    }
    router.refresh();
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const [kind, id] = (active.id as string).split(":");
    const targetGroupId = over.id as string;

    const item = items.find((it) => it.kind === kind && it.id === id);
    if (!item) return;

    const currentGroup = macroGroupForStatus(item.pipelineStatus);
    if (currentGroup.id === targetGroupId) return;

    const nextStatus = firstStatusForGroup(item, targetGroupId);
    if (!nextStatus) return;
    await updateStatus(item, nextStatus);
  }

  return (
    <>
      <div className="flex flex-col gap-3 md:hidden">
        {macroGroups.map((group) => {
          const { visible, collapsed } = splitGroupItems(group, items);
          return (
            <AccordionSection
              key={group.id}
              group={group}
              visibleItems={visible}
              collapsedItems={collapsed}
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
              const { visible, collapsed } = splitGroupItems(group, items);
              return (
                <Column
                  key={group.id}
                  group={group}
                  visibleItems={visible}
                  collapsedItems={collapsed}
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
  visibleItems,
  collapsedItems,
  greenLightThreshold,
  onStatusChange,
}: {
  group: { id: string; label: string; color: string };
  visibleItems: PipelineItem[];
  collapsedItems: PipelineItem[];
  greenLightThreshold: number;
  onStatusChange: (item: PipelineItem, status: PipelineStatus) => void;
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
          {visibleItems.length + collapsedItems.length}
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {visibleItems.map((it) => (
          <DraggableCard
            key={`${it.kind}:${it.id}`}
            item={it}
            groupColor={group.color}
            greenLightThreshold={greenLightThreshold}
            onStatusChange={onStatusChange}
          />
        ))}

        {collapsedItems.length > 0 && (
          <>
            <button
              onClick={() => setShowCollapsed((v) => !v)}
              className="w-fit text-xs font-semibold text-ink/50 hover:text-accent hover:underline"
            >
              {showCollapsed
                ? "Réduire"
                : `Voir les marques ghostées/archivées/anciennes (${collapsedItems.length})`}
            </button>
            {showCollapsed &&
              collapsedItems.map((it) => (
                <DraggableCard
                  key={`${it.kind}:${it.id}`}
                  item={it}
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
  visibleItems,
  collapsedItems,
  greenLightThreshold,
  onStatusChange,
}: {
  group: { id: string; label: string; color: string };
  visibleItems: PipelineItem[];
  collapsedItems: PipelineItem[];
  greenLightThreshold: number;
  onStatusChange: (item: PipelineItem, status: PipelineStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const [showCollapsed, setShowCollapsed] = useState(false);
  const total = visibleItems.length + collapsedItems.length;

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
          {visibleItems.map((it) => (
            <CardBody
              key={`${it.kind}:${it.id}`}
              item={it}
              groupColor={group.color}
              greenLightThreshold={greenLightThreshold}
              onStatusChange={onStatusChange}
            />
          ))}
          {total === 0 && <p className="px-1 py-1 text-xs font-light text-ink/30">Rien ici.</p>}

          {collapsedItems.length > 0 && (
            <>
              <button
                onClick={() => setShowCollapsed((v) => !v)}
                className="w-fit text-xs font-semibold text-ink/50 hover:text-accent hover:underline"
              >
                {showCollapsed
                  ? "Réduire"
                  : `Voir les marques ghostées/archivées/anciennes (${collapsedItems.length})`}
              </button>
              {showCollapsed &&
                collapsedItems.map((it) => (
                  <CardBody
                    key={`${it.kind}:${it.id}`}
                    item={it}
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
  item,
  groupColor,
  greenLightThreshold,
  onStatusChange,
}: {
  item: PipelineItem;
  groupColor: string;
  greenLightThreshold: number;
  onStatusChange: (item: PipelineItem, status: PipelineStatus) => void;
}) {
  const days =
    item.kind === "brand" ? countBusinessDays(new Date(item.engagementStartDate), new Date()) : 0;

  const statusOptions = item.kind === "brand" ? pipelineColumns.map((c) => c.status) : quoteRequestStatuses;
  const dueBadge = dueBadgeFromDate(item.nextActionDate, new Date());

  return (
    <BrandCard
      dueBadge={dueBadge}
      brand={{
        id: item.kind === "brand" ? item.id : item.brandId,
        name: item.name,
        emoji: item.emoji,
        platform: item.kind === "brand" ? item.platform : undefined,
        acquisitionPath: item.kind === "brand" ? item.acquisitionPath : "DIRECT",
        potentialRevenue: item.potentialRevenue,
        engagementDays:
          item.kind === "brand" && showsEngagementDays(item.pipelineStatus, days, greenLightThreshold)
            ? days
            : null,
        serviceType: item.kind === "quoteRequest" ? item.badgeLabel : null,
        href: item.kind === "quoteRequest" ? `/marques/${item.brandId}` : undefined,
      }}
      engagementColor={groupColor}
      statusContent={
        <select
          value={item.pipelineStatus}
          onChange={(e) => onStatusChange(item, e.target.value as PipelineStatus)}
          onPointerDown={(e) => e.stopPropagation()}
          className="w-full rounded-lg border border-accent-light bg-soft px-2.5 py-1.5 text-xs font-semibold text-ink outline-none focus:border-accent"
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
      }
      footer={
        <div className="mb-2.5 flex flex-col gap-1 border-t border-soft pt-2.5 text-xs font-light text-ink/60">
          {item.kind === "quoteRequest" && (
            <p className="font-semibold text-accent/80">📋 Demande de devis · client existant</p>
          )}
          {item.lastContactDate && (
            <p>Dernier contact : {new Date(item.lastContactDate).toLocaleDateString("fr-FR")}</p>
          )}
          {item.nextActionDate && (
            <p>Prochaine action : {new Date(item.nextActionDate).toLocaleDateString("fr-FR")}</p>
          )}
          {!item.lastContactDate && !item.nextActionDate && <p className="text-ink/30">⠿ Glisser ici</p>}
        </div>
      }
    />
  );
}

function DraggableCard({
  item,
  groupColor,
  greenLightThreshold,
  onStatusChange,
}: {
  item: PipelineItem;
  groupColor: string;
  greenLightThreshold: number;
  onStatusChange: (item: PipelineItem, status: PipelineStatus) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `${item.kind}:${item.id}`,
  });

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
        item={item}
        groupColor={groupColor}
        greenLightThreshold={greenLightThreshold}
        onStatusChange={onStatusChange}
      />
    </div>
  );
}
