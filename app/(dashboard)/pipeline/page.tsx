import { prisma } from "@/lib/prisma";
import KanbanBoard from "@/components/KanbanBoard";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const [brands, settings] = await Promise.all([
    prisma.brand.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.settings.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } }),
  ]);

  const serialized = brands.map((b) => ({
    id: b.id,
    name: b.name,
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
      <header>
        <h1 className="font-sans text-3xl font-extrabold text-ink">Pipeline prospection</h1>
        <p className="font-light text-ink/60">Glisse-dépose les marques entre les statuts.</p>
      </header>
      <KanbanBoard brands={serialized} greenLightThreshold={settings.daysBeforeGreenLight} />
    </div>
  );
}
