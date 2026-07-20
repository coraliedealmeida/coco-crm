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

  const rows = clients.map((client) => ({
    id: client.id,
    brandId: client.brand.id,
    name: client.brand.name,
    emoji: client.brand.emoji,
    sector: client.brand.sector,
    revenue: client.projects.reduce((sum, p) => sum + paidTotal(p.invoices), 0),
    activeProjectCount: client.projects.filter((p) => !isProjectDone(p)).length,
  }));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between">
        <div>
          <Link href="/clients" className="text-sm font-semibold text-accent hover:underline">
            ← Retour aux projets
          </Link>
          <h1 className="mt-2 font-sans text-3xl font-extrabold text-ink">Clients</h1>
        </div>
        <Link href="/clients/new" className="text-sm font-semibold text-accent hover:underline">
          + Nouveau client
        </Link>
      </header>

      <ClientsTable rows={rows} />
    </div>
  );
}
