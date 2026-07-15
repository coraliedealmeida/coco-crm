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
        <h1 className="font-sans text-3xl font-extrabold text-ink">Offres</h1>
      </header>

      <PricingGridManager initialServices={services} initialBundles={bundles} />
    </div>
  );
}
