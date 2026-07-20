import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isProjectDone, paidTotal, projectLabel, macroGroupForStep, projectMacroGroups } from "@/lib/projects";
import ClientsGrid from "@/components/ClientsGrid";

export const dynamic = "force-dynamic";

function macroColor(step: string): string {
  return projectMacroGroups.find((g) => g.id === macroGroupForStep(step))?.color ?? "#9CA3AF";
}

export default async function ClientsListPage() {
  const clients = await prisma.client.findMany({
    include: { brand: true, projects: { include: { invoices: true }, orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  const serialized = clients.map((client) => ({
    id: client.id,
    brandId: client.brand.id,
    name: client.brand.name,
    emoji: client.brand.emoji,
    revenue: client.projects.reduce((sum, p) => sum + paidTotal(p.invoices), 0),
    projects: client.projects
      .filter((p) => !isProjectDone(p))
      .map((p) => ({
        id: p.id,
        label: projectLabel(p),
        currentStep: p.currentStep,
        color: macroColor(p.currentStep),
      })),
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

      {serialized.length === 0 ? (
        <p className="rounded-3xl bg-white p-6 text-sm font-light text-ink/50 shadow-soft">
          Aucun client pour l&apos;instant. Un client est créé automatiquement dès qu&apos;une marque passe au statut
          &quot;Devis accepté&quot; dans le Pipeline, ou directement via &quot;+ Nouveau client&quot;.
        </p>
      ) : (
        <ClientsGrid clients={serialized} />
      )}
    </div>
  );
}
