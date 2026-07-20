import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { projectLabel } from "@/lib/projects";
import { formatRevenue } from "@/lib/format";

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

export default async function AnneeProjetsPage({ searchParams }: { searchParams: { year?: string } }) {
  const now = new Date();
  const projects = await prisma.project.findMany({
    where: { currentStep: "Terminé" },
    include: { client: { include: { brand: true } } },
  });

  const years = Array.from(new Set(projects.map((p) => (p.completedAt ?? p.createdAt).getFullYear())));
  if (!years.includes(now.getFullYear())) years.push(now.getFullYear());
  years.sort((a, b) => b - a);

  const selectedYear = Number(searchParams.year) || now.getFullYear();

  const projectsOfYear = projects.filter((p) => (p.completedAt ?? p.createdAt).getFullYear() === selectedYear);
  const totalOfYear = projectsOfYear.reduce((sum, p) => sum + (p.quoteAmount ?? 0), 0);

  const months = MONTH_LABELS.map((label, index) => ({
    label,
    projects: projectsOfYear
      .filter((p) => (p.completedAt ?? p.createdAt).getMonth() === index)
      .sort((a, b) => (a.completedAt ?? a.createdAt).getTime() - (b.completedAt ?? b.createdAt).getTime()),
  }));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between">
        <div>
          <Link href="/clients" className="text-sm font-semibold text-accent hover:underline">
            ← Retour aux projets
          </Link>
          <h1 className="mt-2 font-sans text-3xl font-extrabold text-ink">Vue annuelle des projets</h1>
          <p className="font-light text-ink/60">
            {projectsOfYear.length} projet(s) terminé(s) en {selectedYear} · {formatRevenue(totalOfYear)}
          </p>
        </div>
        <div className="flex w-fit gap-1 rounded-2xl bg-white p-1.5 shadow-soft">
          {years.map((year) => (
            <Link
              key={year}
              href={`/clients/annee?year=${year}`}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                year === selectedYear ? "bg-accent text-white" : "text-ink/60 hover:bg-soft"
              }`}
            >
              {year}
            </Link>
          ))}
        </div>
      </header>

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
                  {p.quoteAmount != null && (
                    <p className="text-xs font-semibold text-accent">{formatRevenue(p.quoteAmount)}</p>
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
