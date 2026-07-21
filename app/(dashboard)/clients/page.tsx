import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StatsGrid from "@/components/StatsGrid";
import ProjectsKanbanBoard from "@/components/ProjectsKanbanBoard";
import { isProjectActive, invoicedInMonth, paidInMonth, factureRelanceDue } from "@/lib/projects";
import { formatRevenue } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const [projects, settings] = await Promise.all([
    prisma.project.findMany({ include: { client: { include: { brand: true } }, invoices: true } }),
    prisma.settings.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } }),
  ]);

  // Ordre le plus récent d'abord, sur la date de signature (permet l'antidatage), sinon la création.
  projects.sort(
    (a, b) =>
      (b.signedAt ?? b.createdAt).getTime() - (a.signedAt ?? a.createdAt).getTime()
  );

  const now = new Date();
  const projectsEnCours = projects.filter(isProjectActive).length;
  const totalFactureCeMois = projects.reduce((sum, p) => sum + invoicedInMonth(p.invoices, now), 0);
  const totalEncaisseCeMois = projects.reduce((sum, p) => sum + paidInMonth(p.invoices, now), 0);

  const serialized = projects.map((p) => ({
    id: p.id,
    clientId: p.clientId,
    brandName: p.client.brand.name,
    brandEmoji: p.client.brand.emoji,
    serviceType: p.serviceType,
    name: p.name,
    currentStep: p.currentStep,
    steps: p.steps,
    quoteAmount: p.quoteAmount,
    estimatedDeliveryDate: p.estimatedDeliveryDate ? p.estimatedDeliveryDate.toISOString() : null,
    relance: factureRelanceDue(p.invoices, settings, now),
  }));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-sans text-3xl font-extrabold text-ink">Projets</h1>
        </div>
        <Link href="/clients/liste" className="text-sm font-semibold text-accent hover:underline">
          Voir la liste des clients →
        </Link>
      </header>

      <StatsGrid
        stats={[
          { label: "Projets en cours", value: String(projectsEnCours), accent: "#8B5CF6" },
          { label: "Total facturé ce mois", value: formatRevenue(totalFactureCeMois), accent: "#FB923C" },
          { label: "Total encaissé ce mois", value: formatRevenue(totalEncaisseCeMois), accent: "#CCFF00" },
        ]}
      />

      {projects.length === 0 ? (
        <p className="rounded-3xl bg-white p-6 text-sm font-light text-ink/50 shadow-soft">
          Aucun projet pour l&apos;instant. Un projet est créé automatiquement par prestation cochée dans les notes
          d&apos;appel découverte, dès qu&apos;une marque passe au statut &quot;Devis accepté&quot; dans le Pipeline.
        </p>
      ) : (
        <ProjectsKanbanBoard projects={serialized} />
      )}
    </div>
  );
}
