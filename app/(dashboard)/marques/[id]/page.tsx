import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { countBusinessDays } from "@/lib/business-days";
import { avatarColor, initials, statusLabel, nextAutomaticActionLabel } from "@/lib/pipeline";
import { serviceTypeLabel } from "@/lib/serviceTypes";
import { isProjectDone, paidTotal } from "@/lib/projects";
import BrandForm from "@/components/BrandForm";
import BrandActions from "@/components/BrandActions";
import HistoryPanel from "@/components/HistoryPanel";
import RemindersPanel from "@/components/RemindersPanel";
import NewProjectButton from "@/components/NewProjectButton";
import { formatRevenue } from "@/lib/format";

export const dynamic = "force-dynamic";

const backLinks: Record<string, { href: string; label: string }> = {
  pipeline: { href: "/pipeline", label: "← Retour au Pipeline" },
  projets: { href: "/clients", label: "← Retour aux projets" },
  clients: { href: "/clients/liste", label: "← Retour aux clients" },
  prospects: { href: "/marques", label: "← Retour aux prospects" },
  dashboard: { href: "/", label: "← Retour au Dashboard" },
};

export default async function BrandDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { from?: string };
}) {
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
      include: { projects: { orderBy: { createdAt: "desc" }, include: { invoices: true } } },
    }),
  ]);

  if (!brand) notFound();

  const back = backLinks[searchParams.from ?? ""] ?? backLinks.prospects;

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
      <Link href={back.href} className="w-fit text-sm font-semibold text-accent hover:underline">
        {back.label}
      </Link>

      <header className="flex items-center justify-between">
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

      <div className="grid grid-cols-4 gap-6">
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

      {/* Projets : sous les données dès qu'il y en a */}
      {client && projects.length > 0 && (
        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-sans text-base font-extrabold text-ink">
              <span>📁</span> Projets
            </h2>
            <Link href={`/marques/${brand.id}/notes`} className="text-sm font-semibold text-accent hover:underline">
              📋 Notes d&apos;appel découverte
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/clients/${client.id}/projects/${project.id}`}
                className="flex items-center justify-between rounded-xl bg-soft px-4 py-3 transition hover:bg-accent-light/30"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{serviceTypeLabel[project.serviceType]}</p>
                  <p className="text-xs font-light text-ink/50">{project.currentStep}</p>
                </div>
                <div className="flex items-center gap-3">
                  {project.quoteAmount != null && (
                    <span className="text-xs font-semibold text-ink/60">{formatRevenue(project.quoteAmount)}</span>
                  )}
                  {isProjectDone(project) && <span className="text-xs font-semibold text-accent">✅ Terminé</span>}
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-4">
            <NewProjectButton clientId={client.id} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
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
