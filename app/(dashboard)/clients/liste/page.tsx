import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { serviceTypeLabel } from "@/lib/serviceTypes";
import { isProjectDone, isProjectPaid } from "@/lib/projects";

export const dynamic = "force-dynamic";

function formatRevenue(amount: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    amount
  );
}

export default async function ClientsListPage() {
  const clients = await prisma.client.findMany({
    include: { brand: true, projects: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/clients" className="text-sm font-semibold text-accent hover:underline">
          ← Retour aux projets
        </Link>
        <h1 className="mt-2 font-sans text-3xl font-extrabold text-ink">Clients</h1>
        <p className="font-light text-ink/60">Marques passées en devis accepté, avec le CA généré par client.</p>
      </header>

      {clients.length === 0 ? (
        <p className="rounded-3xl bg-white p-6 text-sm font-light text-ink/50 shadow-soft">
          Aucun client pour l&apos;instant. Un client est créé automatiquement dès qu&apos;une marque passe au statut
          &quot;Devis accepté&quot; dans le Pipeline.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {clients.map((client) => {
            const revenue = client.projects.filter(isProjectPaid).reduce((sum, p) => sum + (p.quoteAmount ?? 0), 0);
            const inProgress = client.projects.filter((p) => !isProjectDone(p));
            return (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-soft transition hover:shadow-softer"
              >
                <div>
                  <p className="font-sans text-lg font-extrabold text-ink">{client.brand.name}</p>
                  <p className="mt-1 text-sm font-light text-ink/50">
                    {inProgress.length > 0
                      ? `${inProgress.length} projet(s) en cours : ${inProgress
                          .map((p) => serviceTypeLabel[p.serviceType])
                          .join(", ")}`
                      : "Aucun projet en cours"}
                  </p>
                </div>
                <p className="font-sans text-lg font-extrabold text-accent">{formatRevenue(revenue)}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
