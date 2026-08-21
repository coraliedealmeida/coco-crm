import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { countBusinessDays } from "@/lib/business-days";
import { statusLabel } from "@/lib/pipeline";
import { serviceTypeLabel } from "@/lib/serviceTypes";
import { isProjectActive, projectLabel, remainingToInvoice } from "@/lib/projects";
import DashboardSection from "@/components/DashboardSection";
import BrandCard from "@/components/BrandCard";
import RelaunchButton from "@/components/RelaunchButton";
import GuidedSession from "@/components/GuidedSession";
import type { SessionBrand } from "@/components/GuidedSession";
import { formatRevenue } from "@/lib/format";
import { dueBadgeFromDate, dueBadgeFromThreshold, dueSortKey } from "@/lib/dueStatus";
import { getDailyQualificationBatch } from "@/lib/prospectImport";
import DashboardNotesWidget from "@/components/DashboardNotesWidget";
import TodayTaskRow from "@/components/TodayTaskRow";
import { isEngagementDue, nextEngagementContact, contactProfileLink, type EngagementContact } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

/** Lien de profil récupéré à l'import (activation prospect), quand il existe. */
function profileUrlFromDiscoveryNotes(discoveryNotes: unknown): string | null {
  if (discoveryNotes && typeof discoveryNotes === "object" && "profileUrl" in discoveryNotes) {
    const value = (discoveryNotes as { profileUrl?: unknown }).profileUrl;
    return typeof value === "string" ? value : null;
  }
  return null;
}

/** Contacts identifiés à l'import (discoveryNotes.allContacts), quand ils existent. */
function contactsFromDiscoveryNotes(discoveryNotes: unknown): EngagementContact[] {
  if (discoveryNotes && typeof discoveryNotes === "object" && "allContacts" in discoveryNotes) {
    const value = (discoveryNotes as { allContacts?: unknown }).allContacts;
    return Array.isArray(value) ? (value as EngagementContact[]) : [];
  }
  return [];
}

/** Contacts d'intérêt d'une marque pour la rotation en routine d'engagement : ceux notés
 * à la main sur la fiche en priorité, sinon ceux récupérés à l'import LinkedIn/Instagram. */
function engagementContactsFor(brand: {
  contacts: { name: string; role: string | null; profileUrl: string | null; platform: string }[];
  discoveryNotes: unknown;
}): EngagementContact[] {
  if (brand.contacts.length > 0) {
    return brand.contacts.map((c) => ({
      name: c.name,
      position: c.role ?? "",
      profileUrl: contactProfileLink(c),
      platform: c.platform,
    }));
  }
  return contactsFromDiscoveryNotes(brand.discoveryNotes);
}

/**
 * Première lecture jamais faite sur ce singleton : deux requêtes concurrentes (double rendu
 * React en dev, prefetch...) peuvent toutes les deux tenter la création et l'une échoue alors
 * sur la contrainte d'unicité — on se rabat simplement sur une lecture dans ce cas précis.
 */
async function getOrCreateDashboardNote() {
  try {
    return await prisma.dashboardNote.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } });
  } catch {
    return prisma.dashboardNote.findUniqueOrThrow({ where: { id: "singleton" } });
  }
}

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
  const [brands, settings, dueReminders, projects, pendingInvoices, quoteRequests, reconsiderBrands, reconsiderQuoteRequests, qualificationBatch, dashboardTasks, dashboardNote] = await Promise.all([
    // Les clients créés directement (sans prospection) ne doivent alimenter aucun bloc prospection.
    // { not: "DIRECT" } exclurait aussi les marques sans acquisitionPath renseigné (NULL) — OR explicite.
    prisma.brand.findMany({
      where: { archivedAt: null, OR: [{ acquisitionPath: null }, { acquisitionPath: { not: "DIRECT" } }] },
      include: { contacts: { orderBy: { createdAt: "asc" } } },
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
    prisma.project.findMany({ include: { client: { include: { brand: true } }, invoices: true } }),
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
    // Demandes de devis mises "Pas maintenant" (indépendamment du statut de la marque
    // elle-même, cf. cas d'un client existant avec une nouvelle demande en parallèle).
    prisma.quoteRequest.findMany({
      where: { status: "PAS_MAINTENANT", reconsiderDate: { lte: new Date() } },
      include: { client: { include: { brand: true } } },
      orderBy: { reconsiderDate: "asc" },
    }),
    getDailyQualificationBatch(),
    prisma.dashboardTask.findMany({ orderBy: { createdAt: "asc" } }),
    getOrCreateDashboardNote(),
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

  // Marques réellement "à engager" aujourd'hui : espacées d'au moins daysBetweenEngagements
  // jours ouvrés depuis le dernier passage, pour ne pas relancer une marque tous les jours.
  const dueForEngagement = routineBrands.filter((b) =>
    isEngagementDue(b.lastEngagementAt, now, settings.daysBetweenEngagements)
  );

  const relanceBrands = brands
    .filter(
      (b) =>
        ["PREMIER_DM", "RELANCE_1", "DEVIS_ENVOYE", "RELANCE_DEVIS_1"].includes(b.pipelineStatus) &&
        b.nextActionDate &&
        b.nextActionDate <= now
    )
    .map((b) => ({ ...b, dueBadge: dueBadgeFromDate(b.nextActionDate, now) }))
    .sort((a, b) => dueSortKey(a.dueBadge) - dueSortKey(b.dueBadge));

  // Données pour la session guidée
  const sessionMessageBrands: SessionBrand[] = [
    ...greenLightBrands.map((b) => ({
      id: b.id,
      name: b.name,
      emoji: b.emoji,
      platform: b.platform,
      pipelineStatus: b.pipelineStatus,
      contactName: b.contactName,
      sector: b.sector,
      notes: b.notes,
    })),
    ...relanceBrands
      .filter((b) => ["PREMIER_DM", "RELANCE_1"].includes(b.pipelineStatus))
      .map((b) => ({
        id: b.id,
        name: b.name,
        emoji: b.emoji,
        platform: b.platform,
        pipelineStatus: b.pipelineStatus,
        contactName: b.contactName,
        sector: b.sector,
        notes: b.notes,
      })),
  ];
  // Déduplique (greenLight est déjà dans routineBrands mais pipelineStatus ROUTINE_ENGAGEMENT)
  // — seules les marques dues aujourd'hui (cf. dueForEngagement) apparaissent ici.
  const sessionRoutineBrands: SessionBrand[] = dueForEngagement.map((b) => {
    const contacts = engagementContactsFor(b);
    const engagement = nextEngagementContact(contacts, b.lastEngagementContactIndex);
    return {
      id: b.id,
      name: b.name,
      emoji: b.emoji,
      platform: b.platform,
      pipelineStatus: b.pipelineStatus,
      contactName: b.contactName,
      sector: b.sector,
      notes: b.notes,
      profileUrl: profileUrlFromDiscoveryNotes(b.discoveryNotes),
      engagementContact: engagement,
    };
  });

  const projectsEnCours = projects.filter(isProjectActive);
  const aFacturer = projects.filter((p) => p.currentStep === "Facture à faire");

  // Tâches personnelles datées d'aujourd'hui ou en retard, non terminées.
  const dueTasks = dashboardTasks.filter((t) => !t.completed && t.dueDate && t.dueDate <= now);

  // Les sources de "Relances du jour" (marques, rappels, demandes de devis, tâches datées) sont
  // fusionnées et triées ensemble par gravité de retard, pour un seul ordre cohérent dans le bloc.
  const relanceItems = [
    ...relanceBrands.map((b) => ({
      key: `relance-${b.id}`,
      sortKey: dueSortKey(b.dueBadge),
      node: (
        <BrandCard
          key={`relance-${b.id}`}
          compact
          brand={{ ...b, engagementDays: null, potentialRevenue: b.potentialRevenue }}
          dueBadge={b.dueBadge}
          statusContent={<span>{statusLabel(b.pipelineStatus)}</span>}
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
            compact
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
            statusContent={<span className="text-accent">📌 {r.label}</span>}
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
            compact
            brand={{
              id: q.client.brand.id,
              name: q.client.brand.name,
              emoji: q.client.brand.emoji,
              engagementDays: null,
              potentialRevenue: q.potentialRevenue,
              serviceType: q.label || "Demande de devis",
            }}
            dueBadge={dueBadge}
            statusContent={<span>{statusLabel(q.status)}</span>}
          />
        ),
      };
    }),
    // Marques "Pas maintenant" dont la date de rappel est atteinte — fusionnées dans Relances du jour
    ...reconsiderBrands.map((b) => {
      const dueBadge = dueBadgeFromDate(b.reconsiderDate, now);
      return {
        key: `reconsider-${b.id}`,
        sortKey: dueSortKey(dueBadge),
        node: (
          <BrandCard
            key={`reconsider-${b.id}`}
            compact
            brand={{ id: b.id, name: b.name, emoji: b.emoji, engagementDays: null, potentialRevenue: b.potentialRevenue }}
            dueBadge={dueBadge}
            statusContent={
              <span style={{ color: "#C4B5FD" }}>
                ⏸ rappel du {b.reconsiderDate ? new Date(b.reconsiderDate).toLocaleDateString("fr-FR") : ""}
              </span>
            }
            footer={<RelaunchButton id={b.id} kind="brand" />}
          />
        ),
      };
    }),
    // Demandes de devis "Pas maintenant" dont la date de rappel est atteinte — même logique
    // que les marques en pause, mais indépendante du statut de la marque elle-même.
    ...reconsiderQuoteRequests.map((q) => {
      const dueBadge = dueBadgeFromDate(q.reconsiderDate, now);
      return {
        key: `reconsider-quote-${q.id}`,
        sortKey: dueSortKey(dueBadge),
        node: (
          <BrandCard
            key={`reconsider-quote-${q.id}`}
            compact
            brand={{
              id: q.client.brand.id,
              name: q.client.brand.name,
              emoji: q.client.brand.emoji,
              engagementDays: null,
              potentialRevenue: q.potentialRevenue,
              serviceType: q.label || "Demande de devis",
            }}
            dueBadge={dueBadge}
            statusContent={
              <span style={{ color: "#C4B5FD" }}>
                ⏸ rappel du {q.reconsiderDate ? new Date(q.reconsiderDate).toLocaleDateString("fr-FR") : ""}
              </span>
            }
            footer={<RelaunchButton id={q.id} kind="quoteRequest" />}
          />
        ),
      };
    }),
    // Tâches personnelles datées d'aujourd'hui ou en retard — fusionnées dans Relances du jour,
    // comme demandé, plutôt que dans une section séparée.
    ...dueTasks.map((t) => {
      const dueBadge = dueBadgeFromDate(t.dueDate, now);
      return {
        key: `task-${t.id}`,
        sortKey: dueSortKey(dueBadge),
        node: <TodayTaskRow key={`task-${t.id}`} id={t.id} label={t.label} dueBadge={dueBadge} />,
      };
    }),
  ].sort((a, b) => a.sortKey - b.sortKey);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center gap-3">
        <span className="text-3xl">🐾</span>
        <h1 className="font-sans text-4xl font-extrabold tracking-tight text-ink">Dashboard</h1>
      </header>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-sans text-lg font-extrabold text-ink">Prospection</h2>
          <GuidedSession
            messageBrands={sessionMessageBrands}
            routineBrands={sessionRoutineBrands}
            qualificationBrands={qualificationBatch}
          />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          <DashboardSection
            title="Routine d'engagement"
            icon="🌱"
            accent="#C4B5FD"
            count={dueForEngagement.length}
            isEmpty={dueForEngagement.length === 0}
            emptyLabel="Aucune marque à engager aujourd'hui."
          >
            {dueForEngagement.map((b) => (
              <BrandCard
                key={b.id}
                compact
                brand={{ ...b, engagementDays: b.days, potentialRevenue: b.potentialRevenue }}
                dueBadge={b.dueBadge}
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
                compact
                engagementColor="#CCFF00"
                brand={{ ...b, engagementDays: b.days, potentialRevenue: b.potentialRevenue }}
                dueBadge={b.dueBadge}
              />
            ))}
          </DashboardSection>

          <DashboardSection
            title="Relances du jour"
            icon="⏰"
            accent="#8B5CF6"
            count={relanceItems.length}
            isEmpty={relanceItems.length === 0}
            emptyLabel="Aucune relance aujourd'hui."
          >
            {relanceItems.map((item) => item.node)}
          </DashboardSection>
        </div>
      </section>

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
                    <span className="text-xs font-semibold text-ink/60">
                      {formatRevenue(remainingToInvoice(p.quoteAmount, p.invoices))}
                    </span>
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

      <section>
        <h2 className="mb-4 font-sans text-lg font-extrabold text-ink">Notes & to-do</h2>
        <div className="overflow-hidden rounded-3xl bg-white shadow-soft">
          <div className="h-1.5" style={{ backgroundColor: "#8B5CF6" }} />
          <div className="p-6">
            <DashboardNotesWidget
              initialTasks={dashboardTasks.map((t) => ({
                id: t.id,
                label: t.label,
                completed: t.completed,
                dueDate: t.dueDate ? t.dueDate.toISOString() : null,
              }))}
              initialNote={dashboardNote.content}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
