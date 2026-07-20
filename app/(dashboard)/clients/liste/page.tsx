import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isProjectDone, paidTotal, projectLabel, macroGroupForStep, projectMacroGroups } from "@/lib/projects";
import { avatarColor, initials } from "@/lib/pipeline";
import { formatRevenue } from "@/lib/format";

export const dynamic = "force-dynamic";

const MAX_VISIBLE_PROJECTS = 4;

function macroColor(step: string): string {
  return projectMacroGroups.find((g) => g.id === macroGroupForStep(step))?.color ?? "#9CA3AF";
}

export default async function ClientsListPage() {
  const clients = await prisma.client.findMany({
    include: { brand: true, projects: { include: { invoices: true }, orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between">
        <div>
          <Link href="/clients" className="text-sm font-semibold text-accent hover:underline">
            ← Retour aux projets
          </Link>
          <h1 className="mt-2 font-sans text-3xl font-extrabold text-ink">Clients</h1>
          <p className="font-light text-ink/60">Marques passées en devis accepté, avec le CA généré par client.</p>
        </div>
        <Link href="/clients/new" className="text-sm font-semibold text-accent hover:underline">
          + Nouveau client
        </Link>
      </header>

      {clients.length === 0 ? (
        <p className="rounded-3xl bg-white p-6 text-sm font-light text-ink/50 shadow-soft">
          Aucun client pour l&apos;instant. Un client est créé automatiquement dès qu&apos;une marque passe au statut
          &quot;Devis accepté&quot; dans le Pipeline, ou directement via &quot;+ Nouveau client&quot;.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {clients.map((client) => {
            const revenue = client.projects.reduce((sum, p) => sum + paidTotal(p.invoices), 0);
            const inProgress = client.projects.filter((p) => !isProjectDone(p));
            const visible = inProgress.slice(0, MAX_VISIBLE_PROJECTS);
            const hiddenCount = inProgress.length - visible.length;

            return (
              <Link
                key={client.id}
                href={`/marques/${client.brand.id}?from=clients`}
                className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-soft transition hover:shadow-softer"
              >
                <div className="flex items-center gap-3">
                  {client.brand.emoji ? (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-soft text-lg">
                      {client.brand.emoji}
                    </div>
                  ) : (
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white"
                      style={{ backgroundColor: avatarColor(client.brand.name) }}
                    >
                      {initials(client.brand.name)}
                    </div>
                  )}
                  <p className="truncate font-sans text-base font-extrabold text-ink">{client.brand.name}</p>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-cta/25 px-3.5 py-2.5">
                  <span className="text-xs font-light text-ink/60">CA généré</span>
                  <span className="font-sans text-sm font-extrabold text-ink">{formatRevenue(revenue)}</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  {visible.length === 0 ? (
                    <p className="text-xs font-light text-ink/40">Aucun projet en cours.</p>
                  ) : (
                    visible.map((p) => (
                      <div key={p.id} className="flex items-center gap-2 rounded-lg bg-soft px-2.5 py-1.5">
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: macroColor(p.currentStep) }}
                        />
                        <span className="flex-1 truncate text-xs font-semibold text-ink">{projectLabel(p)}</span>
                        <span className="shrink-0 truncate text-[11px] font-light text-ink/40">{p.currentStep}</span>
                      </div>
                    ))
                  )}
                  {hiddenCount > 0 && (
                    <p className="pl-1 text-xs font-light text-ink/40">+ {hiddenCount} autre(s)</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
