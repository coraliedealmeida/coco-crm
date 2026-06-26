import Link from "next/link";
import { prisma } from "@/lib/prisma";
import MarquesTable from "@/components/MarquesTable";

export const dynamic = "force-dynamic";

export default async function MarquesPage() {
  const brands = await prisma.brand.findMany({ orderBy: { createdAt: "desc" } });

  const rows = brands.map((b) => ({
    id: b.id,
    name: b.name,
    platform: b.platform,
    pipelineStatus: b.pipelineStatus,
    nextActionDate: b.nextActionDate?.toISOString() ?? null,
  }));

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

      <MarquesTable rows={rows} />
    </div>
  );
}
