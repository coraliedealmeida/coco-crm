import Link from "next/link";
import { prisma } from "@/lib/prisma";
import KanbanBoard from "@/components/KanbanBoard";
import StatCard from "@/components/StatCard";

export const dynamic = "force-dynamic";

const devisInProgressStatuses = ["DEVIS_ENVOYE", "RELANCE_DEVIS_1", "RELANCE_DEVIS_2", "DEVIS_ACCEPTE", "DEVIS_REFUSE"];

function formatRevenue(amount: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    amount
  );
}

export default async function PipelinePage() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [brands, settings, appelsGroups] = await Promise.all([
    prisma.brand.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.settings.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } }),
    prisma.contactHistoryEntry.groupBy({
      by: ["brandId"],
      where: { type: "Appel découverte", date: { gte: thirtyDaysAgo } },
    }),
  ]);

  const appelsCount = appelsGroups.length;

  const potentialRevenue = brands
    .filter((b) => !b.archivedAt)
    .reduce((sum, b) => sum + (b.potentialRevenue ?? 0), 0);

  const devisCount = brands.filter((b) => devisInProgressStatuses.includes(b.pipelineStatus)).length;

  const serialized = brands.map((b) => ({
    id: b.id,
    name: b.name,
    emoji: b.emoji,
    platform: b.platform,
    pipelineStatus: b.pipelineStatus,
    lastContactDate: b.lastContactDate?.toISOString() ?? null,
    nextActionDate: b.nextActionDate?.toISOString() ?? null,
    engagementStartDate: b.engagementStartDate.toISOString(),
    potentialRevenue: b.potentialRevenue,
    updatedAt: b.updatedAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-sans text-3xl font-extrabold text-ink">Pipeline prospection</h1>
          <p className="font-light text-ink/60">Glisse-dépose les marques entre les statuts.</p>
        </div>
        <Link href="/marques" className="text-sm font-semibold text-accent hover:underline">
          Voir la liste des prospects →
        </Link>
      </header>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Revenu potentiel en cours" value={formatRevenue(potentialRevenue)} accent="#CCFF00" />
        <StatCard label="Appels découverte (30 derniers jours)" value={String(appelsCount)} accent="#34D399" />
        <StatCard label="Devis envoyés" value={String(devisCount)} accent="#8B5CF6" />
      </div>

      <KanbanBoard brands={serialized} greenLightThreshold={settings.daysBeforeGreenLight} />
    </div>
  );
}
