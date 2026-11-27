import Link from "next/link";
import { prismaRaw } from "@/lib/prisma";
import { DEVIS_ANNULE } from "@/lib/trash";
import { projectLabel } from "@/lib/projects";
import { formatDateFr, formatRevenue } from "@/lib/format";
import RestoreButton from "@/components/RestoreButton";
import type { TrashModel } from "@/lib/trash";

export const dynamic = "force-dynamic";

type Row = { model: TrashModel; id: string; title: string; detail: string; deletedAt: Date };

function sameTime(a: Date | null | undefined, b: Date | null | undefined) {
  return !!a && !!b && a.getTime() === b.getTime();
}

/**
 * Corbeille : tout ce qui a été « supprimé » depuis l'interface. Rien n'est effacé de la base ;
 * chaque ligne se restaure avec ce qui avait été mis à la corbeille en même temps.
 * Une ligne par action : une marque supprimée avec ses projets n'apparaît qu'une fois.
 */
export default async function CorbeillePage() {
  const [brands, projects, invoices, quoteRequests] = await Promise.all([
    prismaRaw.brand.findMany({ where: { deletedAt: { not: null } }, orderBy: { deletedAt: "desc" } }),
    prismaRaw.project.findMany({
      where: { deletedAt: { not: null } },
      include: { client: { include: { brand: true } } },
      orderBy: { deletedAt: "desc" },
    }),
    prismaRaw.invoice.findMany({
      where: { deletedAt: { not: null } },
      include: { project: { include: { client: { include: { brand: true } } } } },
      orderBy: { deletedAt: "desc" },
    }),
    prismaRaw.quoteRequest.findMany({
      where: { deletedAt: { not: null } },
      include: { client: { include: { brand: true } } },
      orderBy: { deletedAt: "desc" },
    }),
  ]);

  const rows: Row[] = [
    ...brands.map((b) => ({
      model: "brand" as const,
      id: b.id,
      title: `${b.emoji ?? ""} ${b.name}`.trim(),
      detail: "Marque (avec son client, ses projets, factures et demandes de devis)",
      deletedAt: b.deletedAt!,
    })),
    ...projects
      .filter((p) => p.deletedReason !== DEVIS_ANNULE && !sameTime(p.client.brand.deletedAt, p.deletedAt))
      .map((p) => ({
        model: "project" as const,
        id: p.id,
        title: `${p.client.brand.name} — ${projectLabel(p)}`,
        detail: "Projet (avec ses factures)",
        deletedAt: p.deletedAt!,
      })),
    ...invoices
      .filter((i) => !sameTime(i.project.deletedAt, i.deletedAt))
      .map((i) => ({
        model: "invoice" as const,
        id: i.id,
        title: `${i.project.client.brand.name} — ${i.label}`,
        detail: `Facture de ${formatRevenue(i.amount)} · ${projectLabel(i.project)}`,
        deletedAt: i.deletedAt!,
      })),
    ...quoteRequests
      .filter((q) => !sameTime(q.client.brand.deletedAt, q.deletedAt))
      .map((q) => ({
        model: "quoteRequest" as const,
        id: q.id,
        title: `${q.client.brand.name} — ${q.label ?? "Demande de devis"}`,
        detail: "Demande de devis",
        deletedAt: q.deletedAt!,
      })),
  ].sort((a, b) => b.deletedAt.getTime() - a.deletedAt.getTime());

  const hiddenByCancel = projects.filter((p) => p.deletedReason === DEVIS_ANNULE);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/parametres" className="text-sm font-light text-ink/50 hover:text-ink">
          ← Paramètres
        </Link>
        <h1 className="mt-2 font-sans text-3xl font-extrabold text-ink">Corbeille</h1>
        <p className="mt-1 max-w-2xl text-sm font-light text-ink/60">
          Tout ce que tu supprimes arrive ici : rien n&apos;est jamais effacé. Les éléments de la corbeille
          sont masqués partout et ne comptent dans aucun total. « Restaurer » les remet exactement en place.
        </p>
      </header>

      <section className="rounded-3xl bg-white p-6 shadow-soft">
        <h2 className="mb-4 font-sans text-base font-extrabold text-ink">Supprimés ({rows.length})</h2>
        {rows.length === 0 ? (
          <p className="text-sm font-light text-ink/50">La corbeille est vide.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map((r) => (
              <li key={`${r.model}-${r.id}`} className="flex items-center justify-between gap-4 rounded-xl bg-soft px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{r.title}</p>
                  <p className="text-xs font-light text-ink/60">
                    {r.detail} · supprimé le {formatDateFr(r.deletedAt)}
                  </p>
                </div>
                <RestoreButton model={r.model} id={r.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {hiddenByCancel.length > 0 && (
        <section className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 className="mb-1 font-sans text-base font-extrabold text-ink">
            Masqués après annulation d&apos;un « Devis accepté » ({hiddenByCancel.length})
          </h2>
          <p className="mb-4 text-xs font-light text-ink/60">
            Ils réapparaissent tout seuls si le devis repasse à « Devis accepté ».
          </p>
          <ul className="flex flex-col gap-2">
            {hiddenByCancel.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 rounded-xl bg-soft px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {p.client.brand.name} — {projectLabel(p)}
                  </p>
                  <p className="text-xs font-light text-ink/60">masqué le {formatDateFr(p.deletedAt!)}</p>
                </div>
                <RestoreButton model="project" id={p.id} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
