import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { countBusinessDays } from "@/lib/business-days";
import { statusLabel, platformLabel } from "@/lib/pipeline";
import BrandForm from "@/components/BrandForm";
import BrandActions from "@/components/BrandActions";
import HistoryPanel from "@/components/HistoryPanel";

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
        <div>
          <h1 className="font-sans text-3xl font-extrabold text-ink">{brand.name}</h1>
          <p className="font-light text-ink/60">
            {platformLabel[brand.platform]} · {statusLabel(brand.pipelineStatus)} · {days} jours ouvrés d&apos;engagement
          </p>
        </div>
        {greenLight && (
          <span className="rounded-full bg-cta px-4 py-2 text-sm font-semibold text-ink">
            🟢 Feu vert DM
          </span>
        )}
      </header>

      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h2 className="mb-4 font-sans text-base font-extrabold text-ink">État des lieux</h2>
        <div className="grid grid-cols-4 gap-4">
          <InfoTile label="Premier contact" value={new Date(firstContactDate).toLocaleDateString("fr-FR")} />
          <InfoTile label="Statut actuel" value={statusLabel(brand.pipelineStatus)} />
          <InfoTile
            label="Prochaine action"
            value={
              brand.nextActionDate
                ? new Date(brand.nextActionDate).toLocaleDateString("fr-FR")
                : "Aucune prévue"
            }
          />
          <InfoTile
            label="Revenu potentiel"
            value={brand.potentialRevenue != null ? formatRevenue(brand.potentialRevenue) : "Non renseigné"}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
          <div className="rounded-3xl bg-white p-6 shadow-soft">
            <h2 className="mb-4 font-sans text-base font-extrabold text-ink">Informations</h2>
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
          <BrandActions brandId={brand.id} />
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 className="mb-4 font-sans text-base font-extrabold text-ink">Historique des contacts</h2>
          <HistoryPanel
            entries={brand.contactHistory.map((e) => ({
              id: e.id,
              type: e.type,
              content: e.content,
              date: e.date.toISOString(),
            }))}
          />
        </div>
      </div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-soft px-4 py-3">
      <p className="text-xs font-light text-ink/50">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}
