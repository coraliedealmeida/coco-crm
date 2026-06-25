import { prisma } from "@/lib/prisma";
import KanbanBoard from "@/components/KanbanBoard";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const brands = await prisma.brand.findMany({
    where: { archivedAt: null },
    orderBy: { updatedAt: "desc" },
  });

  const serialized = brands.map((b) => ({
    id: b.id,
    name: b.name,
    platform: b.platform,
    pipelineStatus: b.pipelineStatus,
    lastContactDate: b.lastContactDate?.toISOString() ?? null,
    nextActionDate: b.nextActionDate?.toISOString() ?? null,
    engagementStartDate: b.engagementStartDate.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-sans text-3xl font-extrabold text-ink">Pipeline prospection</h1>
        <p className="font-light text-ink/60">Glisse-dépose les marques entre les statuts.</p>
      </header>
      <KanbanBoard brands={serialized} />
    </div>
  );
}
