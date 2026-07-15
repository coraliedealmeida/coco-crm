import { prisma } from "@/lib/prisma";
import PricingGridManager from "@/components/PricingGridManager";

export const dynamic = "force-dynamic";

export default async function OffrePage() {
  const [services, bundles] = await Promise.all([
    prisma.service.findMany({ orderBy: { order: "asc" } }),
    prisma.bundle.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-sans text-3xl font-extrabold text-ink">Offre</h1>
        <p className="font-light text-ink/60">Prestations et bundles utilisés dans les notes d&apos;appel découverte et le configurateur de devis.</p>
      </header>

      <PricingGridManager initialServices={services} initialBundles={bundles} />
    </div>
  );
}
