import Link from "next/link";
import { prisma } from "@/lib/prisma";
import KanbanBoard from "@/components/KanbanBoard";
import StatsGrid from "@/components/StatsGrid";
import { formatRevenue } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [brands, settings, appelsGroups, devisGroups] = await Promise.all([
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
    // "Devis envoyé" est loggé automatiquement dans l'historique de contact au moment où la
    // marque passe au statut DEVIS_ENVOYE (cf. lib/statusEffects.ts) : compter ces entrées du
    // mois en cours donne les devis réellement envoyés ce mois-ci, plutôt que le nombre de
    // marques actuellement à ce statut (qui ne bouge pas avec le temps).
    prisma.contactHistoryEntry.groupBy({
      by: ["brandId"],
      where: { type: "Devis envoyé", date: { gte: startOfMonth } },
    }),
  ]);

  const brandIds = new Set(brands.map((b) => b.id));
  const appelsCount = appelsGroups.filter((g) => brandIds.has(g.brandId)).length;
  const devisCount = devisGroups.filter((g) => brandIds.has(g.brandId)).length;

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

      <KanbanBoard brands={serialized} greenLightThreshold={settings.daysBeforeGreenLight} />
    </div>
  );
}
