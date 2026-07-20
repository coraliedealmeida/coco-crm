import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isProjectDone, paidTotal } from "@/lib/projects";
import ClientsTable from "@/components/ClientsTable";

export const dynamic = "force-dynamic";

export default async function ClientsListPage() {
  const clients = await prisma.client.findMany({
    include: { brand: true, projects: { include: { invoices: true } } },
    orderBy: { createdAt: "desc" },
  });

  const rows = clients.map((client) => {
    const projectDates = client.projects.map((p) => p.signedAt ?? p.createdAt);
    const lastProjectDate = projectDates.length > 0 ? new Date(Math.max(...projectDates.map((d) => d.getTime()))) : null;

    return {
      id: client.id,
      brandId: client.brand.id,
      name: client.brand.name,
      emoji: client.brand.emoji,
      revenue: client.projects.reduce((sum, p) => sum + paidTotal(p.invoices), 0),
      activeProjectCount: client.projects.filter((p) => !isProjectDone(p)).length,
      lastProjectDate: lastProjectDate ? lastProjectDate.toISOString() : null,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between">
        <div>
          <Link href="/clients" className="text-sm font-semibold text-accent hover:underline">
            ← Retour aux projets
          </Link>
          <h1 className="mt-2 font-sans text-3xl font-extrabold text-ink">Clients</h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Link
            href="/clients/new"
            className="rounded-xl bg-cta px-5 py-3 font-semibold text-ink transition hover:opacity-90"
          >
            + Nouveau client
          </Link>
          <Link href="/clients/annee" className="text-xs font-light text-ink/40 hover:text-accent hover:underline">
            Vue annuelle des projets terminés →
          </Link>
        </div>
      </header>

      <ClientsTable rows={rows} />
    </div>
  );
}
