import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { platformLabel } from "@/lib/pipeline";
import { serviceTypeLabel } from "@/lib/serviceTypes";
import { isProjectPaid, paymentStatusLabel } from "@/lib/projects";
import HistoryPanel from "@/components/HistoryPanel";
import NewProjectButton from "@/components/NewProjectButton";

export const dynamic = "force-dynamic";

function formatRevenue(amount: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    amount
  );
}

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      brand: { include: { contactHistory: { orderBy: { date: "desc" } } } },
      projects: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!client) notFound();

  const revenue = client.projects.filter(isProjectPaid).reduce((sum, p) => sum + (p.quoteAmount ?? 0), 0);
  const inProgress = client.projects.filter((p) => p.currentStep !== "Terminé" && p.currentStep !== "Payé");
  const done = client.projects.filter((p) => p.currentStep === "Terminé" || p.currentStep === "Payé");

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/clients" className="text-sm font-semibold text-accent hover:underline">
          ← Retour aux clients
        </Link>
        <h1 className="mt-2 font-sans text-3xl font-extrabold text-ink">{client.brand.name}</h1>
        <p className="font-light text-ink/60">{platformLabel[client.brand.platform]}</p>
      </header>

      <div className="grid grid-cols-3 gap-6">
        <InfoTile icon="💰" label="Chiffre d'affaires généré" value={formatRevenue(revenue)} accent="#CCFF00" />
        <InfoTile icon="🚧" label="Projets en cours" value={String(inProgress.length)} accent="#8B5CF6" />
        <InfoTile icon="✅" label="Projets terminés" value={String(done.length)} accent="#C4B5FD" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
          <div className="rounded-3xl bg-white p-6 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-sans text-base font-extrabold text-ink">
                <span>📁</span> Projets
              </h2>
              <Link
                href={`/marques/${client.brand.id}/notes`}
                className="text-sm font-semibold text-accent hover:underline"
              >
                📋 Notes d&apos;appel découverte
              </Link>
            </div>

            <div className="flex flex-col gap-2">
              {client.projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/clients/${client.id}/projects/${project.id}`}
                  className="flex items-center justify-between rounded-xl bg-soft px-4 py-3 transition hover:bg-accent-light/30"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">{serviceTypeLabel[project.serviceType]}</p>
                    <p className="text-xs font-light text-ink/50">{project.currentStep}</p>
                  </div>
                  <span className="text-xs font-light text-ink/50">{paymentStatusLabel[project.paymentStatus]}</span>
                </Link>
              ))}
              {client.projects.length === 0 && (
                <p className="text-sm font-light text-ink/40">Aucun projet pour l&apos;instant.</p>
              )}
            </div>

            <div className="mt-4">
              <NewProjectButton clientId={client.id} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-3xl bg-white p-6 shadow-soft">
            <h2 className="mb-4 flex items-center gap-2 font-sans text-base font-extrabold text-ink">
              <span>🗓️</span> Historique de prospection
            </h2>
            <div className="max-h-96 overflow-y-auto pr-1">
              <HistoryPanel
                brandId={client.brand.id}
                entries={client.brand.contactHistory.map((e) => ({
                  id: e.id,
                  type: e.type,
                  content: e.content,
                  date: e.date.toISOString(),
                }))}
              />
            </div>
          </div>
          <Link
            href={`/marques/${client.brand.id}`}
            className="w-fit text-sm font-semibold text-accent hover:underline"
          >
            Voir la fiche prospection complète →
          </Link>
        </div>
      </div>
    </div>
  );
}

function InfoTile({ icon, label, value, accent }: { icon: string; label: string; value: string; accent: string }) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-soft">
      <div className="h-1.5" style={{ backgroundColor: accent }} />
      <div className="p-6">
        <p className="flex items-center gap-1.5 text-sm font-light text-ink/50">
          <span className="text-lg">{icon}</span>
          {label}
        </p>
        <p
          className="mt-2 font-sans text-xl font-extrabold leading-tight"
          style={{ color: accent === "#CCFF00" ? "#1D1C1F" : accent }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
