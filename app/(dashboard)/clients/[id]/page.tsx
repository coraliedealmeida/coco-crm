import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

// La fiche client est fusionnée avec la fiche prospect (/marques/[brandId]) : on redirige.
export default async function ClientRedirect({ params }: { params: { id: string } }) {
  const client = await prisma.client.findUnique({ where: { id: params.id }, select: { brandId: true } });
  if (!client) notFound();
  redirect(`/marques/${client.brandId}?from=projets`);
}
