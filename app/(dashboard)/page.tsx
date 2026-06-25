import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { countBusinessDays } from "@/lib/business-days";
import { statusLabel } from "@/lib/pipeline";
import DashboardSection from "@/components/DashboardSection";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [brands, settings] = await Promise.all([
    prisma.brand.findMany({ where: { archivedAt: null } }),
    prisma.settings.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } }),
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

  const monthEntries = await prisma.contactHistoryEntry.findMany({
    where: { date: { gte: startOfMonth } },
  });
  const dmCount = monthEntries.filter((e) => e.type === "Premier DM" || e.type.startsWith("Relance")).length;
  const reponseCount = monthEntries.filter((e) => e.type === "Réponse reçue").length;
  const appelCount = monthEntries.filter((e) => e.type === "Appel découverte").length;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-sans text-3xl font-extrabold text-ink">Dashboard</h1>
        <p className="font-light text-ink/60">Tes actions du jour, en un coup d&apos;œil.</p>
      </header>

      <section className="grid grid-cols-3 gap-4">
        <StatCard label="DMs envoyés ce mois-ci" value={dmCount} />
        <StatCard label="Réponses reçues" value={reponseCount} />
        <StatCard label="Appels découverte" value={appelCount} />
      </section>

      <section className="grid grid-cols-3 gap-6">
        <DashboardSection title="Routine d'engagement en cours" isEmpty={routineBrands.length === 0}>
          {routineBrands.map((b) => (
            <BrandRow key={b.id} id={b.id} name={b.name} detail={`${b.days} jours ouvrés`} />
          ))}
        </DashboardSection>

        <DashboardSection title="Feux verts DM" isEmpty={greenLightBrands.length === 0} emptyLabel="Aucun feu vert pour le moment.">
          {greenLightBrands.map((b) => (
            <BrandRow key={b.id} id={b.id} name={b.name} detail="Prête pour le premier DM" highlight />
          ))}
        </DashboardSection>

        <DashboardSection title="Relances du jour" isEmpty={relanceBrands.length === 0} emptyLabel="Aucune relance aujourd'hui.">
          {relanceBrands.map((b) => (
            <BrandRow key={b.id} id={b.id} name={b.name} detail={statusLabel(b.pipelineStatus)} />
          ))}
        </DashboardSection>
      </section>

      <section className="grid grid-cols-3 gap-6">
        <DashboardSection title="Projets en cours" isEmpty emptyLabel="Disponible en Phase 2." />
        <DashboardSection title="À facturer" isEmpty emptyLabel="Disponible en Phase 2." />
        <DashboardSection title="Factures en attente de paiement" isEmpty emptyLabel="Disponible en Phase 2." />
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-sm font-light text-ink/60">{label}</p>
      <p className="mt-2 font-sans text-3xl font-extrabold text-accent">{value}</p>
    </div>
  );
}

function BrandRow({
  id,
  name,
  detail,
  highlight,
}: {
  id: string;
  name: string;
  detail: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={`/marques/${id}`}
      className={`flex items-center justify-between rounded-xl px-4 py-3 transition hover:bg-soft ${
        highlight ? "bg-cta/20" : "bg-soft/60"
      }`}
    >
      <span className="text-sm font-semibold text-ink">{name}</span>
      <span className="text-xs font-light text-ink/60">{detail}</span>
    </Link>
  );
}
