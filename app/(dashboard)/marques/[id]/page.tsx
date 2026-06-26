import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { countBusinessDays } from "@/lib/business-days";
import { platformLabel, avatarColor, initials } from "@/lib/pipeline";
import BrandForm from "@/components/BrandForm";
import BrandActions from "@/components/BrandActions";
import HistoryPanel from "@/components/HistoryPanel";
import StatusSelector from "@/components/StatusSelector";

export const dynamic = "force-dynamic";

function formatRevenue(amount: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    amount
  );
}

export default async function BrandDetailPage({ params }: { params: { id: string } }) {
  const [brand, settings] = await Promise.all([
    prisma.brand.findUnique({
      where: { id: params.id },
      include: { contactHistory: { orderBy: { date: "desc" } } },
    }),
    prisma.settings.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } }),
  ]);

  if (!brand) notFound();

  const days = countBusinessDays(brand.engagementStartDate, new Date());
  const greenLight = days >= settings.daysBeforeGreenLight && brand.pipelineStatus === "ROUTINE_ENGAGEMENT";
  const firstContactDate =
    brand.contactHistory.length > 0
      ? brand.contactHistory[brand.contactHistory.length - 1].date
      : brand.engagementStartDate;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-extrabold text-white"
            style={{ backgroundColor: avatarColor(brand.name) }}
          >
            {initials(brand.name)}
          </div>
          <div>
            <h1 className="font-sans text-4xl font-extrabold tracking-tight text-ink">{brand.name}</h1>
            <p className="font-light text-ink/50">
              {platformLabel[brand.platform]} · {days} jours ouvrés d&apos;engagement
            </p>
          </div>
        </div>
        {greenLight && (
          <span className="rounded-full bg-cta px-4 py-2 text-sm font-semibold text-ink shadow-soft">
            🟢 Feu vert DM
          </span>
        )}
      </header>

      <div className="overflow-hidden rounded-3xl bg-white shadow-soft">
        <div className="h-1.5 bg-accent" />
        <div className="p-6">
          <h2 className="mb-4 flex items-center gap-2 font-sans text-base font-extrabold text-ink">
            <span>🐾</span> État des lieux
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <InfoTile
              icon="📅"
              label="Premier contact"
              value={new Date(firstContactDate).toLocaleDateString("fr-FR")}
              accent="#C4B5FD"
            />
            <InfoTile icon="🎯" label="Statut actuel" accent="#60A5FA">
              <StatusSelector brandId={brand.id} status={brand.pipelineStatus} />
            </InfoTile>
            <InfoTile
              icon="⏰"
              label="Prochaine action"
              value={
                brand.nextActionDate
                  ? new Date(brand.nextActionDate).toLocaleDateString("fr-FR")
                  : "Aucune prévue"
              }
              accent="#8B5CF6"
            />
            <InfoTile
              icon="💰"
              label="Revenu potentiel"
              value={brand.potentialRevenue != null ? formatRevenue(brand.potentialRevenue) : "Non renseigné"}
              accent="#CCFF00"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 className="mb-4 flex items-center gap-2 font-sans text-base font-extrabold text-ink">
            <span>📝</span> Informations
          </h2>
          <BrandForm
            initial={{
              id: brand.id,
              name: brand.name,
              platform: brand.platform,
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
    <div className="overflow-hidden rounded-xl bg-soft">
      <div className="h-1" style={{ backgroundColor: accent }} />
      <div className="px-4 py-3">
        <p className="flex items-center gap-1.5 text-xs font-light text-ink/50">
          <span>{icon}</span>
          {label}
        </p>
        {children ?? <p className="mt-1 text-sm font-semibold text-ink">{value}</p>}
      </div>
    </div>
  );
}
