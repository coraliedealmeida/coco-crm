import Link from "next/link";
import { prisma, NOT_DELETED } from "@/lib/prisma";
import { projectLabel } from "@/lib/projects";
import { formatRevenue } from "@/lib/format";
import StatsGrid from "@/components/StatsGrid";
import BackButton from "@/components/BackButton";
import { parisYearMonth } from "@/lib/dates";

export const dynamic = "force-dynamic";

const MONTH_LABELS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

// Montant réel : total des factures saisies dans l'encart Facturation ; à défaut de facture, le montant du devis.
function amountFor(p: { quoteAmount: number | null; invoices: { amount: number }[] }): number | null {
  if (p.invoices.length > 0) return p.invoices.reduce((sum, i) => sum + i.amount, 0);
  return p.quoteAmount;
}

export default async function AnneeProjetsPage({ searchParams }: { searchParams: { year?: string } }) {
  const now = new Date();
  const projects = await prisma.project.findMany({
    where: { currentStep: "Terminé" },
    include: { client: { include: { brand: true } }, invoices: { where: NOT_DELETED } },
  });

  const years = Array.from(new Set(projects.map((p) => parisYearMonth(p.completedAt ?? p.createdAt).year)));
  if (!years.includes(parisYearMonth(now).year)) years.push(parisYearMonth(now).year);
  years.sort((a, b) => b - a);

  const selectedYear = Number(searchParams.year) || parisYearMonth(now).year;

  const projectsOfYear = projects.filter((p) => parisYearMonth(p.completedAt ?? p.createdAt).year === selectedYear);
  const clientsOfYear = new Set(projectsOfYear.map((p) => p.clientId)).size;

  // Le CA encaissé se base sur la date de paiement réelle des factures (Invoice.paidAt), pas sur
  // Project.completedAt : un projet terminé fin décembre peut être payé en janvier suivant (et inversement).
  const paidInvoices = await prisma.invoice.findMany({
    where: { paidAt: { not: null } },
  });
  const revenueEncaisse = paidInvoices
    .filter((inv) => parisYearMonth(inv.paidAt!).year === selectedYear)
    .reduce((sum, inv) => sum + inv.amount, 0);

  const months = MONTH_LABELS.map((label, index) => ({
    label,
    projects: projectsOfYear
      .filter((p) => parisYearMonth(p.completedAt ?? p.createdAt).month === index + 1)
      .sort((a, b) => (a.completedAt ?? a.createdAt).getTime() - (b.completedAt ?? b.createdAt).getTime()),
  }));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <BackButton />
          <h1 className="mt-2 font-sans text-3xl font-extrabold text-ink">Vue annuelle des projets</h1>
        </div>
        <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-2xl bg-white p-1.5 shadow-soft">
          {years.map((year) => (
            <Link
              key={year}
              href={`/clients/annee?year=${year}`}
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                year === selectedYear ? "bg-accent text-white" : "text-ink/60 hover:bg-soft"
              }`}
            >
              {year}
            </Link>
          ))}
        </div>
      </header>

      <StatsGrid
        stats={[
          { label: "Projets terminés", value: String(projectsOfYear.length), accent: "#8B5CF6" },
          { label: "CA encaissé", value: formatRevenue(revenueEncaisse), accent: "#CCFF00" },
          { label: "Clients", value: String(clientsOfYear), accent: "#FB923C" },
        ]}
      />

      <div className="flex gap-4 overflow-x-auto pb-4">
        {months.map((month) => (
          <div key={month.label} className="flex w-64 shrink-0 flex-col gap-3 rounded-2xl bg-soft/60 p-3">
            <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 shadow-softer">
              <h3 className="text-sm font-extrabold text-ink">{month.label}</h3>
              <span className="ml-auto rounded-full bg-soft px-2 py-0.5 text-xs font-semibold text-ink/50">
                {month.projects.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {month.projects.map((p) => (
                <Link
                  key={p.id}
                  href={`/clients/${p.clientId}/projects/${p.id}`}
                  className="flex flex-col gap-1 rounded-xl bg-white p-3 shadow-softer transition hover:shadow-soft"
                >
                  <div className="flex items-center gap-2">
                    {p.client.brand.emoji && <span className="text-sm">{p.client.brand.emoji}</span>}
                    <p className="truncate text-sm font-semibold text-ink">{p.client.brand.name}</p>
                  </div>
                  <p className="truncate text-xs font-light text-ink/50">{projectLabel(p)}</p>
                  {amountFor(p) != null && (
                    <p className="text-xs font-semibold text-accent">{formatRevenue(amountFor(p)!)}</p>
                  )}
                </Link>
              ))}
              {month.projects.length === 0 && <p className="px-1 text-xs font-light text-ink/30">Rien ce mois-ci.</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
