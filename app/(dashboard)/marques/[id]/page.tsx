import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { countBusinessDays } from "@/lib/business-days";
import { avatarColor, initials, statusLabel, nextAutomaticActionLabel } from "@/lib/pipeline";
import { paidTotal } from "@/lib/projects";
import BrandForm from "@/components/BrandForm";
import BrandActions from "@/components/BrandActions";
import HistoryPanel from "@/components/HistoryPanel";
import RemindersPanel from "@/components/RemindersPanel";
import NewProjectButton from "@/components/NewProjectButton";
import ClientProjectsCard from "@/components/ClientProjectsCard";
import QuoteRequestsCard from "@/components/QuoteRequestsCard";
import { formatRevenue } from "@/lib/format";
import BackButton from "@/components/BackButton";

export const dynamic = "force-dynamic";

export default async function BrandDetailPage({ params }: { params: { id: string } }) {
  const [brand, settings, client] = await Promise.all([
    prisma.brand.findUnique({
      where: { id: params.id },
      include: {
        contactHistory: { orderBy: { date: "desc" } },
        reminders: { orderBy: { date: "asc" } },
      },
    }),
    prisma.settings.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } }),
    prisma.client.findUnique({
      where: { brandId: params.id },
      include: {
        projects: { orderBy: { createdAt: "desc" }, include: { invoices: true } },
        quoteRequests: { orderBy: { createdAt: "desc" } },
      },
    }),
  ]);

  if (!brand) notFound();

  const days = countBusinessDays(brand.engagementStartDate, new Date());
  const greenLight = days >= settings.daysBeforeGreenLight && brand.pipelineStatus === "ROUTINE_ENGAGEMENT";
  const firstContactDate =
    brand.contactHistory.length > 0
      ? brand.contactHistory[brand.contactHistory.length - 1].date
      : brand.engagementStartDate;

  const nextReminder = brand.reminders.find((r) => !r.completed);
  const autoActionLabel = nextAutomaticActionLabel(brand.pipelineStatus);
  const nextActionLabel = nextReminder
    ? `${nextReminder.label} — ${new Date(nextReminder.date).toLocaleDateString("fr-FR")}`
    : brand.nextActionDate
      ? `${autoActionLabel ?? "Action prévue"} — ${new Date(brand.nextActionDate).toLocaleDateString("fr-FR")}`
      : (autoActionLabel ?? "Aucune prévue");

  const projects = client?.projects ?? [];
  const revenue = projects.reduce((sum, p) => sum + paidTotal(p.invoices), 0);
  const hasProjects = !!client && projects.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <BackButton className="w-fit text-sm font-semibold text-accent hover:underline" />

      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {brand.emoji ? (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-soft text-2xl">
              {brand.emoji}
            </div>
          ) : (
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-extrabold text-white"
              style={{ backgroundColor: avatarColor(brand.name) }}
            >
              {initials(brand.name)}
            </div>
          )}
          <h1 className="font-sans text-4xl font-extrabold tracking-tight text-ink">{brand.name}</h1>
        </div>
        {greenLight && (
          <span className="rounded-full bg-cta px-4 py-2 text-sm font-semibold text-ink shadow-soft">
            🟢 Feu vert DM
          </span>
        )}
      </header>

      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        <InfoTile
          icon="📅"
          label="Premier contact"
          value={new Date(firstContactDate).toLocaleDateString("fr-FR")}
          accent="#C4B5FD"
        />
        <InfoTile icon="🎯" label="Statut actuel" value={statusLabel(brand.pipelineStatus)} accent="#60A5FA" />
        <InfoTile icon="⏰" label="Prochaine action" value={nextActionLabel} accent="#8B5CF6" />
        <InfoTile
          icon="💰"
          label={hasProjects ? "CA généré" : "Revenu potentiel"}
          value={
            hasProjects
              ? formatRevenue(revenue)
              : brand.potentialRevenue != null
                ? formatRevenue(brand.potentialRevenue)
                : "Non renseigné"
          }
          accent="#CCFF00"
        />
      </div>

      {/* Projets : sous les données dès qu'il y a un client (même sans projet encore) */}
      {client && (
        <ClientProjectsCard
          clientId={client.id}
          brandId={brand.id}
          projects={projects.map((p) => ({
            id: p.id,
            name: p.name,
            serviceType: p.serviceType,
            currentStep: p.currentStep,
            quoteAmount: p.quoteAmount,
            signedAt: p.signedAt ? p.signedAt.toISOString() : null,
            createdAt: p.createdAt.toISOString(),
          }))}
          newProjectSlot={<NewProjectButton clientId={client.id} />}
        />
      )}

      {/* Demandes de devis : uniquement pour un client déjà existant (un nouveau devis pour un
          prospect classique se gère via le statut de la marque elle-même dans le Pipeline). */}
      {client && (
        <QuoteRequestsCard
          clientId={client.id}
          quoteRequests={client.quoteRequests.map((q) => ({
            id: q.id,
            label: q.label,
            serviceTypes: q.serviceTypes,
            status: q.status,
            potentialRevenue: q.potentialRevenue,
          }))}
        />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <div className="rounded-3xl bg-white p-6 shadow-soft">
            <h2 className="mb-4 flex items-center gap-2 font-sans text-base font-extrabold text-ink">
              <span>📝</span> Informations
            </h2>
            <BrandForm
              initial={{
                id: brand.id,
                name: brand.name,
                emoji: brand.emoji,
                platform: brand.platform,
                acquisitionPath: brand.acquisitionPath,
                sector: brand.sector,
                source: brand.source,
                notes: brand.notes ?? "",
                engagementStartDate: brand.engagementStartDate.toISOString(),
                contactName: brand.contactName ?? "",
                contactRole: brand.contactRole ?? "",
                potentialRevenue: brand.potentialRevenue,
              }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-3xl bg-white p-6 shadow-soft">
            <h2 className="mb-4 flex items-center gap-2 font-sans text-base font-extrabold text-ink">
              <span>🗓️</span> Suivi
            </h2>
            <div className="max-h-72 overflow-y-auto pr-1">
              <HistoryPanel
                brandId={brand.id}
                entries={brand.contactHistory.map((e) => ({
                  id: e.id,
                  type: e.type,
                  content: e.content,
                  date: e.date.toISOString(),
                }))}
              />
            </div>
          </div>
          <RemindersPanel
            brandId={brand.id}
            reminders={brand.reminders.map((r) => ({
              id: r.id,
              date: r.date.toISOString(),
              label: r.label,
              completed: r.completed,
            }))}
          />
          <BrandActions brandId={brand.id} />
        </div>
      </div>
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
  accent,
  children,
}: {
  icon: string;
  label: string;
  value?: string;
  accent: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-soft">
      <div className="h-1.5" style={{ backgroundColor: accent }} />
      <div className="p-6">
        <p className="flex items-center gap-1.5 text-sm font-light text-ink/50">
          <span className="text-lg">{icon}</span>
          {label}
        </p>
        {children ?? (
          <p
            className="mt-2 font-sans text-xl font-extrabold leading-tight"
            style={{ color: accent === "#CCFF00" ? "#1D1C1F" : accent }}
          >
            {value}
          </p>
        )}
      </div>
    </div>
  );
}
