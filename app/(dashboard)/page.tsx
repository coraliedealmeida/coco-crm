import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { countBusinessDays } from "@/lib/business-days";
import { statusLabel } from "@/lib/pipeline";
import { serviceTypeLabel } from "@/lib/serviceTypes";
import { isProjectDone, factureRelanceDue, pendingInvoice } from "@/lib/projects";
import DashboardSection from "@/components/DashboardSection";
import BrandCard from "@/components/BrandCard";

export const dynamic = "force-dynamic";

function formatRevenue(amount: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    amount
  );
}

function ProjectRow({
  project,
  statusContent,
}: {
  project: { id: string; clientId: string; brandName: string; serviceType: keyof typeof serviceTypeLabel };
  statusContent: React.ReactNode;
}) {
  return (
    <Link
      href={`/clients/${project.clientId}/projects/${project.id}`}
      className="flex items-center justify-between rounded-xl bg-soft px-4 py-3 transition hover:bg-accent-light/30"
    >
      <div>
        <p className="text-sm font-semibold text-ink">{project.brandName}</p>
        <p className="text-xs font-light text-ink/50">{serviceTypeLabel[project.serviceType]}</p>
      </div>
      {statusContent}
    </Link>
  );
}

export default async function DashboardPage() {
  const [brands, settings, dueReminders, projects] = await Promise.all([
    prisma.brand.findMany({ where: { archivedAt: null } }),
    prisma.settings.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } }),
    prisma.reminder.findMany({
      where: { completed: false, date: { lte: new Date() }, brand: { archivedAt: null } },
      include: { brand: true },
      orderBy: { date: "asc" },
    }),
    prisma.project.findMany({ include: { client: { include: { brand: true } } } }),
  ]);

  const now = new Date();

  const routineBrands = brands
    .filter((b) => b.pipelineStatus === "ROUTINE_ENGAGEMENT")
    .map((b) => ({ ...b, days: countBusinessDays(b.engagementStartDate, now) }))
    .sort((a, b) => b.days - a.days);

  const greenLightBrands = routineBrands.filter((b) => b.days >= settings.daysBeforeGreenLight);

  const relanceBrands = brands.filter(
    (b) =>
      ["PREMIER_DM", "RELANCE_1", "DEVIS_ENVOYE", "RELANCE_DEVIS_1"].includes(b.pipelineStatus) &&
      b.nextActionDate &&
      b.nextActionDate <= now
  );

  const projectsEnCours = projects.filter((p) => !isProjectDone(p));
  const aFacturer = projects.filter((p) => p.currentStep === "Facture à faire");
  const facturesEnAttente = projects.filter((p) => pendingInvoice(p) !== null);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center gap-3">
        <span className="text-3xl">🐾</span>
        <div>
          <h1 className="font-sans text-4xl font-extrabold tracking-tight text-ink">Dashboard</h1>
          <p className="font-light text-ink/50">Tes actions du jour, en un coup d&apos;œil.</p>
        </div>
      </header>

      <section>
        <h2 className="mb-4 font-sans text-lg font-extrabold text-ink">Prospection</h2>
        <div className="grid grid-cols-3 gap-6">
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
                statusContent={<span className="text-xs font-semibold text-accent">🟢 Prête pour le premier DM</span>}
              />
            ))}
          </DashboardSection>

          <DashboardSection
            title="Relances du jour"
            icon="⏰"
            accent="#8B5CF6"
            count={relanceBrands.length + dueReminders.length}
            isEmpty={relanceBrands.length === 0 && dueReminders.length === 0}
            emptyLabel="Aucune relance aujourd'hui."
          >
            {relanceBrands.map((b) => (
              <BrandCard
                key={`relance-${b.id}`}
                brand={{
                  ...b,
                  engagementDays: null,
                  potentialRevenue: b.potentialRevenue,
                }}
                statusContent={<span className="text-xs font-semibold text-ink/60">{statusLabel(b.pipelineStatus)}</span>}
              />
            ))}
            {dueReminders.map((r) => (
              <BrandCard
                key={`reminder-${r.id}`}
                brand={{
                  ...r.brand,
                  engagementDays: null,
                  potentialRevenue: r.brand.potentialRevenue,
                }}
                statusContent={<span className="text-xs font-semibold text-accent">📌 {r.label}</span>}
              />
            ))}
          </DashboardSection>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-sans text-lg font-extrabold text-ink">Suivi projets</h2>
        <div className="grid grid-cols-3 gap-6">
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
                project={{ id: p.id, clientId: p.clientId, brandName: p.client.brand.name, serviceType: p.serviceType }}
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
                project={{ id: p.id, clientId: p.clientId, brandName: p.client.brand.name, serviceType: p.serviceType }}
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
            count={facturesEnAttente.length}
            isEmpty={facturesEnAttente.length === 0}
            emptyLabel="Aucune facture en attente de paiement."
          >
            {facturesEnAttente.map((p) => {
              const relance = factureRelanceDue(p, settings, now);
              const pending = pendingInvoice(p)!;
              return (
                <ProjectRow
                  key={p.id}
                  project={{ id: p.id, clientId: p.clientId, brandName: p.client.brand.name, serviceType: p.serviceType }}
                  statusContent={
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-soft px-2 py-0.5 text-[11px] font-semibold text-ink/60">
                        {pending.kind === "acompte" ? "Acompte" : "Solde"} {formatRevenue(pending.amount)}
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
