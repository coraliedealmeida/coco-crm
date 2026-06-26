import { prisma } from "@/lib/prisma";
import { countBusinessDays } from "@/lib/business-days";
import { statusLabel } from "@/lib/pipeline";
import DashboardSection from "@/components/DashboardSection";
import BrandCard from "@/components/BrandCard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [brands, settings, dueReminders] = await Promise.all([
    prisma.brand.findMany({ where: { archivedAt: null } }),
    prisma.settings.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } }),
    prisma.reminder.findMany({
      where: { completed: false, date: { lte: new Date() }, brand: { archivedAt: null } },
      include: { brand: true },
      orderBy: { date: "asc" },
    }),
  ]);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const routineBrands = brands
    .filter((b) => b.pipelineStatus === "ROUTINE_ENGAGEMENT")
    .map((b) => ({ ...b, days: countBusinessDays(b.engagementStartDate, now) }))
    .sort((a, b) => b.days - a.days);

  const greenLightBrands = routineBrands.filter((b) => b.days >= settings.daysBeforeGreenLight);

  const relanceBrands = brands.filter(
    (b) =>
      ["PREMIER_DM", "RELANCE_1"].includes(b.pipelineStatus) &&
      b.nextActionDate &&
      b.nextActionDate <= now
  );

  let dmCount = 0;
  let reponseCount = 0;
  let appelCount = 0;

  if (settings.showMonthlyStats) {
    const monthEntries = await prisma.contactHistoryEntry.findMany({
      where: { date: { gte: startOfMonth } },
    });
    dmCount = monthEntries.filter((e) => e.type === "Premier DM" || e.type.startsWith("Relance")).length;
    reponseCount = monthEntries.filter((e) => e.type === "Réponse reçue").length;
    appelCount = monthEntries.filter((e) => e.type === "Appel découverte").length;
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center gap-3">
        <span className="text-3xl">🐾</span>
        <div>
          <h1 className="font-sans text-4xl font-extrabold tracking-tight text-ink">Dashboard</h1>
          <p className="font-light text-ink/50">Tes actions du jour, en un coup d&apos;œil.</p>
        </div>
      </header>

      {settings.showMonthlyStats && (
        <section className="grid grid-cols-3 gap-4">
          <StatCard label="DMs envoyés ce mois-ci" value={dmCount} accent="#8B5CF6" />
          <StatCard label="Réponses reçues" value={reponseCount} accent="#34D399" />
          <StatCard label="Appels découverte" value={appelCount} accent="#CCFF00" />
        </section>
      )}

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
        <h2 className="mb-4 font-sans text-lg font-extrabold text-ink/40">Suivi projets (Phase 2)</h2>
        <div className="grid grid-cols-3 gap-6 opacity-60">
          <DashboardSection title="Projets en cours" icon="📁" accent="#9CA3AF" isEmpty emptyLabel="Disponible en Phase 2." />
          <DashboardSection title="À facturer" icon="🧾" accent="#9CA3AF" isEmpty emptyLabel="Disponible en Phase 2." />
          <DashboardSection title="Factures en attente" icon="⏳" accent="#9CA3AF" isEmpty emptyLabel="Disponible en Phase 2." />
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-soft">
      <div className="h-1.5" style={{ backgroundColor: accent }} />
      <div className="p-6">
        <p className="text-sm font-light text-ink/50">{label}</p>
        <p className="mt-2 font-sans text-4xl font-extrabold" style={{ color: accent === "#CCFF00" ? "#1D1C1F" : accent }}>
          {value}
        </p>
      </div>
    </div>
  );
}
