import Link from "next/link";
import { prisma } from "@/lib/prisma";
import KanbanBoard from "@/components/KanbanBoard";
import StatsGrid from "@/components/StatsGrid";
import { formatRevenue } from "@/lib/format";
import { serviceTypeLabel } from "@/lib/serviceTypes";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [brands, settings, appelsGroups, devisGroups, quoteRequests] = await Promise.all([
    // Les clients créés directement (bouton "+ Nouveau client", import) n'ont jamais fait de
    // prospection : ils n'ont rien à faire dans le Pipeline, même une fois "Devis accepté".
    // { not: "DIRECT" } exclurait aussi silencieusement les marques sans acquisitionPath
    // renseigné (NULL) — d'où le OR explicite pour les garder.
    prisma.brand.findMany({
      where: { OR: [{ acquisitionPath: null }, { acquisitionPath: { not: "DIRECT" } }] },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.settings.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } }),
    // Prisma ne supporte pas un filtre sur une relation à l'intérieur de groupBy (where.brand
    // est silencieusement ignoré et peut vider le résultat) : on filtre donc côté code, après
    // coup, en comparant aux marques déjà chargées (qui excluent les clients "création directe").
    prisma.contactHistoryEntry.groupBy({
      by: ["brandId"],
      where: { type: "Appel découverte", date: { gte: startOfMonth } },
    }),
    prisma.contactHistoryEntry.groupBy({
      by: ["brandId"],
      where: { type: "Devis envoyé", date: { gte: startOfMonth } },
    }),
    // Demandes de devis pour des clients déjà existants (ex : marque créée directement) :
    // apparaissent dans le Pipeline en parallèle du statut de prospection classique.
    prisma.quoteRequest.findMany({
      include: { client: { include: { brand: true } } },
    }),
  ]);

  const brandIds = new Set(brands.map((b) => b.id));
  // Une demande de devis loggue ses évènements ("Devis envoyé"...) sur la marque du client
  // concerné, même si celle-ci est en acquisitionPath DIRECT (donc absente de `brandIds`) :
  // on l'ajoute explicitement pour ne pas perdre ces relances légitimes du comptage.
  const quoteRequestBrandIds = new Set(quoteRequests.map((q) => q.client.brand.id));
  const eligibleBrandIds = new Set([...brandIds, ...quoteRequestBrandIds]);
  const appelsCount = appelsGroups.filter((g) => brandIds.has(g.brandId)).length;
  const devisCount = devisGroups.filter((g) => eligibleBrandIds.has(g.brandId)).length;

  const potentialRevenue = brands
    .filter((b) => !b.archivedAt)
    .reduce((sum, b) => sum + (b.potentialRevenue ?? 0), 0);

  const serialized = brands.map((b) => ({
    id: b.id,
    name: b.name,
    emoji: b.emoji,
    platform: b.platform,
    acquisitionPath: b.acquisitionPath,
    pipelineStatus: b.pipelineStatus,
    lastContactDate: b.lastContactDate?.toISOString() ?? null,
    nextActionDate: b.nextActionDate?.toISOString() ?? null,
    engagementStartDate: b.engagementStartDate.toISOString(),
    potentialRevenue: b.potentialRevenue,
    updatedAt: b.updatedAt.toISOString(),
  }));

  const serializedQuoteRequests = quoteRequests.map((q) => ({
    id: q.id,
    brandId: q.client.brand.id,
    name: q.client.brand.name,
    emoji: q.client.brand.emoji,
    pipelineStatus: q.status,
    lastContactDate: q.lastContactDate?.toISOString() ?? null,
    nextActionDate: q.nextActionDate?.toISOString() ?? null,
    potentialRevenue: q.potentialRevenue,
    badgeLabel: q.serviceTypes.length > 0 ? q.serviceTypes.map((s) => serviceTypeLabel[s]).join(", ") : null,
    updatedAt: q.updatedAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-sans text-3xl font-extrabold text-ink">Pipeline prospection</h1>
        </div>
        <Link href="/marques" className="text-sm font-semibold text-accent hover:underline">
          Voir la liste des prospects →
        </Link>
      </header>

      <StatsGrid
        stats={[
          { label: "Revenu potentiel en cours", value: formatRevenue(potentialRevenue), accent: "#CCFF00" },
          { label: "Appels découverte (ce mois-ci)", value: String(appelsCount), accent: "#34D399" },
          { label: "Devis envoyés (ce mois-ci)", value: String(devisCount), accent: "#8B5CF6" },
        ]}
      />

      <KanbanBoard
        brands={serialized}
        quoteRequests={serializedQuoteRequests}
        greenLightThreshold={settings.daysBeforeGreenLight}
      />
    </div>
  );
}
