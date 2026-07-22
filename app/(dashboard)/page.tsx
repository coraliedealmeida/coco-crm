import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { countBusinessDays } from "@/lib/business-days";
import { statusLabel } from "@/lib/pipeline";
import { serviceTypeLabel } from "@/lib/serviceTypes";
import { isProjectActive, projectLabel } from "@/lib/projects";
import DashboardSection from "@/components/DashboardSection";
import BrandCard from "@/components/BrandCard";
import RelaunchButton from "@/components/RelaunchButton";
import { formatRevenue } from "@/lib/format";
import { dueBadgeFromDate, dueBadgeFromThreshold, dueSortKey } from "@/lib/dueStatus";

export const dynamic = "force-dynamic";

function ProjectRow({
  project,
  statusContent,
}: {
  project: {
    id: string;
    clientId: string;
    brandName: string;
    brandEmoji: string | null;
    serviceType: keyof typeof serviceTypeLabel;
    name: string | null;
  };
  statusContent: React.ReactNode;
}) {
  return (
    <Link
      href={`/clients/${project.clientId}/projects/${project.id}`}
      className="flex items-center justify-between rounded-xl bg-soft px-4 py-3 transition hover:bg-accent-light/30"
    >
      <div className="flex items-center gap-2">
        {project.brandEmoji && <span className="text-base">{project.brandEmoji}</span>}
        <div>
          <p className="text-sm font-semibold text-ink">{project.brandName}</p>
          <p className="text-xs font-light text-ink/50">{projectLabel(project)}</p>
        </div>
      </div>
      {statusContent}
    </Link>
  );
}

export default async function DashboardPage() {
  const [brands, settings, dueReminders, projects, pendingInvoices, quoteRequests, reconsiderBrands] = await Promise.all([
    // Les clients créés directement (sans prospection) ne doivent alimenter aucun bloc prospection.
    // { not: "DIRECT" } exclurait aussi les marques sans acquisitionPath renseigné (NULL) — OR explicite.
    prisma.brand.findMany({
      where: { archivedAt: null, OR: [{ acquisitionPath: null }, { acquisitionPath: { not: "DIRECT" } }] },
    }),
    prisma.settings.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } }),
    // Rappels programmés sur une marque OU sur un projet (jamais les deux) — on exclut les
    // marques archivées et les projets déjà terminés, comme pour le reste du Dashboard.
    prisma.reminder.findMany({
      where: {
        completed: false,
        date: { lte: new Date() },
        OR: [
          { brandId: { not: null }, brand: { archivedAt: null } },
          { projectId: { not: null }, project: { currentStep: { not: "Terminé" } } },
        ],
      },
      include: { brand: true, project: { include: { client: { include: { brand: true } } } } },
      orderBy: { date: "asc" },
    }),
    prisma.project.findMany({ include: { client: { include: { brand: true } } } }),
    prisma.invoice.findMany({
      where: { sentAt: { not: null }, paidAt: null },
      include: { project: { include: { client: { include: { brand: true } } } } },
      orderBy: { sentAt: "asc" },
    }),
    // Demandes de devis pour des clients déjà existants : mêmes relances que les marques
    // classiques, à faire apparaître dans "Relances du jour" au même titre.
    prisma.quoteRequest.findMany({
      where: {
        status: { in: ["DEVIS_ENVOYE", "RELANCE_DEVIS_1"] },
        nextActionDate: { lte: new Date() },
      },
      include: { client: { include: { brand: true } } },
    }),
    prisma.brand.findMany({
      where: {
        pipelineStatus: "PAS_MAINTENANT",
        reconsiderDate: { lte: new Date() },
        archivedAt: null,
      },
      orderBy: { reconsiderDate: "asc" },
    }),
  ]);

  const now = new Date();

  const routineBrands = brands
    .filter((b) => b.pipelineStatus === "ROUTINE_ENGAGEMENT")
    .map((b) => {
      const days = countBusinessDays(b.engagementStartDate, now);
      return { ...b, days, dueBadge: dueBadgeFromThreshold(days, settings.daysBeforeGreenLight) };
    })
    .sort((a, b) => dueSortKey(a.dueBadge) - dueSortKey(b.dueBadge) || b.days - a.days);

  const greenLightBrands = routineBrands.filter((b) => b.days >= settings.daysBeforeGreenLight);

  const relanceBrands = brands
    .filter(
      (b) =>
        ["PREMIER_DM", "RELANCE_1", "DEVIS_ENVOYE", "RELANCE_DEVIS_1"].includes(b.pipelineStatus) &&
        b.nextActionDate &&
        b.nextActionDate <= now
    )
    .map((b) => ({ ...b, dueBadge: dueBadgeFromDate(b.nextActionDate, now) }))
    .sort((a, b) => dueSortKey(a.dueBadge) - dueSortKey(b.dueBadge));

  const projectsEnCours = projects.filter(isProjectActive);
  const aFacturer = projects.filter((p) => p.currentStep === "Facture à faire");

  // Les 3 sources de "Relances du jour" (marques, rappels, demandes de devis) sont fusionnées
  // et triées ensemble par gravité de retard, pour un seul ordre cohérent dans le bloc.
  const relanceItems = [
    ...relanceBrands.map((b) => ({
      key: `relance-${b.id}`,
      sortKey: dueSortKey(b.dueBadge),
      node: (
        <BrandCard
          key={`relance-${b.id}`}
          brand={{ ...b, engagementDays: null, potentialRevenue: b.potentialRevenue }}
          dueBadge={b.dueBadge}
          statusContent={<span className="text-xs font-semibold text-ink/60">{statusLabel(b.pipelineStatus)}</span>}
        />
      ),
    })),
    ...dueReminders.map((r) => {
      const target = r.brand ?? r.project!.client.brand;
      const href = r.project ? `/clients/${r.project.clientId}/projects/${r.project.id}` : undefined;
      const dueBadge = dueBadgeFromDate(r.date, now);
      return {
        key: `reminder-${r.id}`,
        sortKey: dueSortKey(dueBadge),
        node: (
          <BrandCard
            key={`reminder-${r.id}`}
            brand={{
              id: target.id,
              name: target.name,
              emoji: target.emoji,
              engagementDays: null,
              potentialRevenue: r.brand?.potentialRevenue,
              serviceType: r.project ? projectLabel(r.project) : null,
              href,
            }}
            dueBadge={dueBadge}
            statusContent={<span className="text-xs font-semibold text-accent">📌 {r.label}</span>}
          />
        ),
      };
    }),
    ...quoteRequests.map((q) => {
      const dueBadge = dueBadgeFromDate(q.nextActionDate, now);
      return {
        key: `quote-${q.id}`,
        sortKey: dueSortKey(dueBadge),
        node: (
          <BrandCard
            key={`quote-${q.id}`}
            brand={{
              id: q.client.brand.id,
              name: q.client.brand.name,
              emoji: q.client.brand.emoji,
              engagementDays: null,
              potentialRevenue: q.potentialRevenue,
              serviceType: q.label || "Demande de devis",
            }}
            dueBadge={dueBadge}
            statusContent={<span className="text-xs font-semibold text-ink/60">{statusLabel(q.status)}</span>}
          />
        ),
      };
    }),
  ].sort((a, b) => a.sortKey - b.sortKey);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center gap-3">
        <span className="text-3xl">🐾</span>
        <div>
          <h1 className="font-sans text-4xl font-extrabold tracking-tight text-ink">Dashboard</h1>
        </div>
      </header>

      <section>
        <h2 className="mb-4 font-sans text-lg font-extrabold text-ink">Prospection</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          <DashboardSection
            title="Routine d'engagement"
            icon="🌱"
            accent="#C4B5FD"
            count={routineBrands.length}
            isEmpty={routineBrands.length === 0}
          >
            {routineBrands.map((b) => (
              <BrandCard
                key={b.id}
                brand={{ ...b, engagementDays: b.days, potentialRevenue: b.potentialRevenue }}
                dueBadge={b.dueBadge}
                statusContent={<span className="text-xs font-semibold text-ink/60">{statusLabel(b.pipelineStatus)}</span>}
              />
            ))}
          </DashboardSection>

          <DashboardSection
            title="Feux verts DM"
            icon="🟢"
            accent="#CCFF00"
            count={greenLightBrands.length}
            isEmpty={greenLightBrands.length === 0}
            emptyLabel="Aucun feu vert pour le moment."
          >
            {greenLightBrands.map((b) => (
              <BrandCard
                key={b.id}
                brand={{ ...b, engagementDays: b.days, potentialRevenue: b.potentialRevenue }}
                dueBadge={b.dueBadge}
                statusContent={<span className="text-xs font-semibold text-accent">🟢 Prête pour le premier DM</span>}
              />
            ))}
          </DashboardSection>

          <DashboardSection
            title="Relances du jour"
            icon="⏰"
            accent="#8B5CF6"
            count={relanceBrands.length + dueReminders.length + quoteRequests.length}
            isEmpty={relanceBrands.length === 0 && dueReminders.length === 0 && quoteRequests.length === 0}
            emptyLabel="Aucune relance aujourd'hui."
          >
            {relanceItems.map((item) => item.node)}
          </DashboardSection>
        </div>
      </section>

      {reconsiderBrands.length > 0 && (
        <section>
          <h2 className="mb-4 font-sans text-lg font-extrabold text-ink">À reconsidérer</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {reconsiderBrands.map((b) => (
              <div key={b.id} className="rounded-2xl bg-white p-4 shadow-md">
                <div className="mb-1 flex items-center gap-2">
                  {b.emoji && <span className="text-base">{b.emoji}</span>}
                  <span className="text-sm font-extrabold text-ink">{b.name}</span>
                  <span className="ml-auto rounded-full px-2.5 py-1 text-xs font-semibold text-white" style={{ backgroundColor: "#C4B5FD" }}>
                    Pas maintenant
                  </span>
                </div>
                {b.reconsiderDate && (
                  <p className="mb-1 text-xs font-light text-ink/50">
                    Rappel prévu : {new Date(b.reconsiderDate).toLocaleDateString("fr-FR")}
                  </p>
                )}
                <RelaunchButton brandId={b.id} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 font-sans text-lg font-extrabold text-ink">Suivi projets</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          <DashboardSection
            title="Projets en cours"
            icon="📁"
            accent="#8B5CF6"
            count={projectsEnCours.length}
            isEmpty={projectsEnCours.length === 0}
            emptyLabel="Aucun projet en cours."
          >
            {projectsEnCours.map((p) => (
              <ProjectRow
                key={p.id}
                project={{
                  id: p.id,
                  clientId: p.clientId,
                  brandName: p.client.brand.name,
                  brandEmoji: p.client.brand.emoji,
                  serviceType: p.serviceType,
                  name: p.name,
                }}
                statusContent={<span className="text-xs font-semibold text-ink/60">{p.currentStep}</span>}
              />
            ))}
          </DashboardSection>

          <DashboardSection
            title="À facturer"
            icon="🧾"
            accent="#FBBF24"
            count={aFacturer.length}
            isEmpty={aFacturer.length === 0}
            emptyLabel="Rien à facturer pour le moment."
          >
            {aFacturer.map((p) => (
              <ProjectRow
                key={p.id}
                project={{
                  id: p.id,
                  clientId: p.clientId,
                  brandName: p.client.brand.name,
                  brandEmoji: p.client.brand.emoji,
                  serviceType: p.serviceType,
                  name: p.name,
                }}
                statusContent={
                  p.quoteAmount != null ? (
                    <span className="text-xs font-semibold text-ink/60">{formatRevenue(p.quoteAmount)}</span>
                  ) : null
                }
              />
            ))}
          </DashboardSection>

          <DashboardSection
            title="Factures en attente"
            icon="⏳"
            accent="#FB923C"
            count={pendingInvoices.length}
            isEmpty={pendingInvoices.length === 0}
            emptyLabel="Aucune facture en attente de paiement."
          >
            {pendingInvoices.map((invoice) => {
              const elapsed = countBusinessDays(invoice.sentAt!, now);
              const relance =
                elapsed >= settings.daysBeforeFactureRelance1 + settings.daysBeforeFactureRelance2
                  ? 2
                  : elapsed >= settings.daysBeforeFactureRelance1
                    ? 1
                    : null;
              return (
                <ProjectRow
                  key={invoice.id}
                  project={{
                    id: invoice.project.id,
                    clientId: invoice.project.clientId,
                    brandName: invoice.project.client.brand.name,
                    brandEmoji: invoice.project.client.brand.emoji,
                    serviceType: invoice.project.serviceType,
                    name: invoice.project.name,
                  }}
                  statusContent={
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-soft px-2 py-0.5 text-[11px] font-semibold text-ink/60">
                        {invoice.label} {formatRevenue(invoice.amount)}
                      </span>
                      {relance && <span className="text-xs font-semibold text-red-500">📮 Relance {relance}</span>}
                    </div>
                  }
                />
              );
            })}
          </DashboardSection>
        </div>
      </section>
    </div>
  );
}
