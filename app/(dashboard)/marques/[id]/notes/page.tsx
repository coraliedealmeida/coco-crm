import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DiscoveryNotesForm from "@/components/DiscoveryNotesForm";

export const dynamic = "force-dynamic";

export default async function DiscoveryNotesPage({ params }: { params: { id: string } }) {
  const [brand, services, bundles] = await Promise.all([
    prisma.brand.findUnique({ where: { id: params.id } }),
    prisma.service.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
    prisma.bundle.findMany({ where: { active: true } }),
  ]);

  if (!brand) notFound();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href={`/marques/${brand.id}`} className="text-sm font-semibold text-accent hover:underline">
          ← Retour à {brand.name}
        </Link>
        <h1 className="mt-2 font-sans text-3xl font-extrabold text-ink">Notes d&apos;appel découverte</h1>
        <p className="font-light text-ink/60">{brand.name}</p>
      </header>

      <DiscoveryNotesForm
        brandId={brand.id}
        initial={(brand.discoveryNotes as Record<string, unknown>) ?? null}
        services={services.map((s) => ({
          id: s.id,
          name: s.name,
          category: s.category,
          price: s.price,
          priceType: s.priceType,
        }))}
        bundles={bundles.map((b) => ({
          id: b.id,
          name: b.name,
          discountPercent: b.discountPercent,
          serviceIds: b.serviceIds,
        }))}
      />
    </div>
  );
}
