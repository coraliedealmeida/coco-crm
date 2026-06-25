import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { countBusinessDays } from "@/lib/business-days";
import { statusLabel, platformLabel } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

export default async function MarquesPage() {
  const brands = await prisma.brand.findMany({ orderBy: { createdAt: "desc" } });
  const now = new Date();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-sans text-3xl font-extrabold text-ink">Marques prospects</h1>
          <p className="font-light text-ink/60">Toutes les marques en routine d&apos;engagement ou en pipeline.</p>
        </div>
        <Link
          href="/marques/new"
          className="rounded-xl bg-cta px-5 py-3 font-semibold text-ink transition hover:opacity-90"
        >
          + Nouvelle marque
        </Link>
      </header>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-soft text-ink/60">
            <tr>
              <th className="px-5 py-3 font-semibold">Marque</th>
              <th className="px-5 py-3 font-semibold">Plateforme</th>
              <th className="px-5 py-3 font-semibold">Secteur</th>
              <th className="px-5 py-3 font-semibold">Statut</th>
              <th className="px-5 py-3 font-semibold">Jours ouvrés</th>
            </tr>
          </thead>
          <tbody>
            {brands.map((b) => (
              <tr key={b.id} className="border-t border-soft hover:bg-soft/50">
                <td className="px-5 py-3">
                  <Link href={`/marques/${b.id}`} className="font-semibold text-ink">
                    {b.name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-ink/70">{platformLabel[b.platform]}</td>
                <td className="px-5 py-3 text-ink/70">{b.sector}</td>
                <td className="px-5 py-3 text-ink/70">{statusLabel(b.pipelineStatus)}</td>
                <td className="px-5 py-3 text-ink/70">
                  {countBusinessDays(b.engagementStartDate, now)}
                </td>
              </tr>
            ))}
            {brands.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-ink/50">
                  Aucune marque pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
