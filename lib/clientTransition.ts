import { ServiceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { projectSteps } from "@/lib/serviceTypes";

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
 */
export async function ensureClientAndProjects(
  brandId: string,
  discoveryNotes: unknown,
  potentialRevenue: number | null
) {
  const existingClient = await prisma.client.findUnique({ where: { brandId } });
  if (existingClient) return existingClient;

  const notes = (discoveryNotes as { serviceTypes?: ServiceType[] } | null) ?? null;
  const serviceTypes = Array.isArray(notes?.serviceTypes) ? notes!.serviceTypes : [];

  // Transaction : le client et ses éventuels projets sont créés ensemble, ou pas du tout
  // (évite un client orphelin si une création échoue en cours de route).
  return prisma.$transaction(async (tx) => {
    const client = await tx.client.create({ data: { brandId } });

    for (const [index, serviceType] of serviceTypes.entries()) {
      await tx.project.create({
        data: {
          clientId: client.id,
          serviceType,
          currentStep: projectSteps[serviceType][0],
          quoteAmount: index === 0 ? potentialRevenue : null,
        },
      });
    }
    return client;
  });
}
