import { ServiceType } from "@prisma/client";
import { prismaRaw } from "@/lib/prisma";
import { projectSteps } from "@/lib/serviceTypes";
import { CREATED_FROM_BRAND, DEVIS_ANNULE } from "@/lib/trash";

/**
 * Transition prospect → client : crée le Client (si pas déjà fait) dès qu'une marque passe
 * en "Devis accepté" — que ce soit via le Pipeline ou une création directe. Un Project est
 * en plus créé par type de prestation coché en Section 3 des notes d'appel découverte, le cas
 * échéant (chaque type a son propre workflow d'étapes, cf. lib/serviceTypes.ts). Sans notes
 * remplies, le Client est créé sans projet — à ajouter ensuite manuellement (bouton "Nouveau
 * projet" sur la fiche), utile pour les clients repris sans passer par le Pipeline (écoles,
 * jurys, anciens clients...).
 * Le montant du devis n'est pas réparti automatiquement entre plusieurs projets (pas de mapping
 * fiable prestation ↔ ligne de facturation) : il est posé sur le premier, à ajuster ensuite.
 *
 * Si le « Devis accepté » avait été annulé (client et projets masqués, voir lib/trash.ts),
 * ils sont simplement réaffichés : jamais de doublon.
 */
export async function ensureClientAndProjects(
  brandId: string,
  discoveryNotes: unknown,
  potentialRevenue: number | null
) {
  // Accès brut : le client peut avoir été masqué par une annulation du devis.
  const existingClient = await prismaRaw.client.findUnique({ where: { brandId } });
  if (existingClient) {
    if (existingClient.deletedAt) {
      await prismaRaw.client.update({
        where: { id: existingClient.id },
        data: { deletedAt: null, deletedReason: null },
      });
    }
    const hidden = await prismaRaw.project.findMany({
      where: { clientId: existingClient.id, deletedReason: DEVIS_ANNULE, createdFrom: CREATED_FROM_BRAND },
      select: { id: true, deletedAt: true },
    });
    for (const p of hidden) {
      await prismaRaw.$transaction([
        prismaRaw.project.update({ where: { id: p.id }, data: { deletedAt: null, deletedReason: null } }),
        prismaRaw.invoice.updateMany({ where: { projectId: p.id, deletedAt: p.deletedAt }, data: { deletedAt: null } }),
      ]);
    }
    return existingClient;
  }

  const notes = (discoveryNotes as { serviceTypes?: ServiceType[] } | null) ?? null;
  const serviceTypes = Array.isArray(notes?.serviceTypes) ? notes!.serviceTypes : [];

  // Transaction : le client et ses éventuels projets sont créés ensemble, ou pas du tout
  // (évite un client orphelin si une création échoue en cours de route).
  return prismaRaw.$transaction(async (tx) => {
    const client = await tx.client.create({ data: { brandId } });

    for (const [index, serviceType] of serviceTypes.entries()) {
      await tx.project.create({
        data: {
          clientId: client.id,
          serviceType,
          currentStep: projectSteps[serviceType][0],
          startDate: new Date(),
          quoteAmount: index === 0 ? potentialRevenue : null,
          createdFrom: CREATED_FROM_BRAND,
        },
      });
    }
    return client;
  });
}
