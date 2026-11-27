import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

// La fiche client est fusionnée avec la fiche prospect (/marques/[brandId]) : on redirige.
export default async function ClientRedirect({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  const client = await prisma.client.findUnique({ where: { id: params.id }, select: { brandId: true } });
  if (!client) notFound();
  redirect(`/marques/${client.brandId}`);
}
