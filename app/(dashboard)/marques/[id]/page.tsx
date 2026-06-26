import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { countBusinessDays } from "@/lib/business-days";
import { statusLabel, platformLabel } from "@/lib/pipeline";
import BrandForm from "@/components/BrandForm";
import BrandActions from "@/components/BrandActions";

export const dynamic = "force-dynamic";

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
              }}
            />
          </div>
          <BrandActions brandId={brand.id} />
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 className="mb-4 font-sans text-base font-extrabold text-ink">Historique complet</h2>
          <div className="flex flex-col gap-3">
            {brand.contactHistory.length === 0 && (
              <p className="text-sm font-light text-ink/50">Aucun contact enregistré.</p>
            )}
            {brand.contactHistory.map((entry) => (
              <div key={entry.id} className="rounded-xl bg-soft px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink">{entry.type}</span>
                  <span className="text-xs font-light text-ink/50">
                    {entry.date.toLocaleDateString("fr-FR")}
                  </span>
                </div>
                {entry.content && <p className="mt-1 text-sm font-light text-ink/70">{entry.content}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
