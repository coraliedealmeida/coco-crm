import { PipelineStatus, ServiceType } from "@prisma/client";
import { prisma, prismaRaw } from "@/lib/prisma";
import { projectSteps } from "@/lib/serviceTypes";
import { resolveSteps } from "@/lib/projects";

/**
 * CORBEILLE — rien n'est jamais effacé de la base.
 *
 * « Supprimer » dans l'interface = poser `deletedAt` (même horodatage sur l'élément et tout ce
 * qui part avec lui). Restaurer = retirer `deletedAt` sur tout ce qui porte ce même horodatage.
 * Les éléments à la corbeille sont masqués partout (voir `lib/prisma.ts`) et ne comptent dans
 * aucun total (CA, à facturer…).
 */

export const DEVIS_ANNULE = "DEVIS_ANNULE";
export const CREATED_FROM_BRAND = "BRAND_ACCEPTED";
export const CREATED_FROM_QUOTE = "QUOTE_REQUEST";

export type TrashModel = "brand" | "project" | "invoice" | "quoteRequest";

// ---------------------------------------------------------------------------
// Mise à la corbeille
// ---------------------------------------------------------------------------

export async function trashInvoice(id: string, at = new Date()) {
  await prismaRaw.invoice.update({ where: { id }, data: { deletedAt: at } });
}

/** Projet + ses factures (celles qui n'étaient pas déjà à la corbeille). */
export async function trashProject(id: string, at = new Date(), reason: string | null = null) {
  await prismaRaw.$transaction([
    prismaRaw.invoice.updateMany({ where: { projectId: id, deletedAt: null }, data: { deletedAt: at } }),
    prismaRaw.project.update({ where: { id }, data: { deletedAt: at, deletedReason: reason } }),
  ]);
}

export async function trashQuoteRequest(id: string, at = new Date()) {
  await prismaRaw.quoteRequest.update({ where: { id }, data: { deletedAt: at } });
}

/** Marque + son client, ses projets, leurs factures et ses demandes de devis. */
export async function trashBrand(id: string, at = new Date()) {
  const client = await prismaRaw.client.findUnique({ where: { brandId: id } });
  await prismaRaw.$transaction(async (tx) => {
    if (client) {
      const projectIds = (
        await tx.project.findMany({ where: { clientId: client.id, deletedAt: null }, select: { id: true } })
      ).map((p) => p.id);
      await tx.invoice.updateMany({ where: { projectId: { in: projectIds }, deletedAt: null }, data: { deletedAt: at } });
      await tx.project.updateMany({ where: { id: { in: projectIds } }, data: { deletedAt: at } });
      await tx.quoteRequest.updateMany({ where: { clientId: client.id, deletedAt: null }, data: { deletedAt: at } });
      if (!client.deletedAt) {
        await tx.client.update({ where: { id: client.id }, data: { deletedAt: at, deletedReason: null } });
      }
    }
    await tx.brand.update({ where: { id }, data: { deletedAt: at } });
  });
}

// ---------------------------------------------------------------------------
// Restauration
// ---------------------------------------------------------------------------

/** Restaure un élément, tout ce qui a été mis à la corbeille en même temps, et ses parents. */
export async function restore(model: TrashModel, id: string) {
  if (model === "invoice") {
    const inv = await prismaRaw.invoice.findUniqueOrThrow({ where: { id } });
    await prismaRaw.invoice.update({ where: { id }, data: { deletedAt: null } });
    await restoreProjectChain(inv.projectId);
    return;
  }
  if (model === "project") {
    await restoreProjectChain(id);
    return;
  }
  if (model === "quoteRequest") {
    const qr = await prismaRaw.quoteRequest.findUniqueOrThrow({ where: { id } });
    await prismaRaw.quoteRequest.update({ where: { id }, data: { deletedAt: null } });
    await restoreClientChain(qr.clientId);
    return;
  }
  // Marque : tout ce qui porte le même horodatage revient avec elle.
  const brand = await prismaRaw.brand.findUniqueOrThrow({ where: { id } });
  const at = brand.deletedAt;
  await prismaRaw.$transaction(async (tx) => {
    await tx.brand.update({ where: { id }, data: { deletedAt: null } });
    const client = await tx.client.findUnique({ where: { brandId: id } });
    if (client && at) {
      if (client.deletedAt?.getTime() === at.getTime()) {
        await tx.client.update({ where: { id: client.id }, data: { deletedAt: null, deletedReason: null } });
      }
      const projectIds = (
        await tx.project.findMany({ where: { clientId: client.id, deletedAt: at }, select: { id: true } })
      ).map((p) => p.id);
      await tx.project.updateMany({ where: { id: { in: projectIds } }, data: { deletedAt: null, deletedReason: null } });
      await tx.invoice.updateMany({ where: { projectId: { in: projectIds }, deletedAt: at }, data: { deletedAt: null } });
      await tx.quoteRequest.updateMany({ where: { clientId: client.id, deletedAt: at }, data: { deletedAt: null } });
    }
  });
}

async function restoreProjectChain(projectId: string) {
  const project = await prismaRaw.project.findUniqueOrThrow({ where: { id: projectId } });
  if (project.deletedAt) {
    const at = project.deletedAt;
    await prismaRaw.$transaction([
      prismaRaw.project.update({ where: { id: projectId }, data: { deletedAt: null, deletedReason: null } }),
      prismaRaw.invoice.updateMany({ where: { projectId, deletedAt: at }, data: { deletedAt: null } }),
    ]);
  }
  await restoreClientChain(project.clientId);
}

async function restoreClientChain(clientId: string) {
  const client = await prismaRaw.client.findUniqueOrThrow({ where: { id: clientId } });
  if (client.deletedAt) {
    await prismaRaw.client.update({ where: { id: clientId }, data: { deletedAt: null, deletedReason: null } });
  }
  const brand = await prismaRaw.brand.findUniqueOrThrow({ where: { id: client.brandId } });
  if (brand.deletedAt) {
    await prismaRaw.brand.update({ where: { id: brand.id }, data: { deletedAt: null } });
  }
}

// ---------------------------------------------------------------------------
// « Devis accepté » annulé puis rétabli
// ---------------------------------------------------------------------------

type ProjectForCheck = {
  serviceType: ServiceType;
  steps: string[];
  currentStep: string;
  _count: { invoices: number; trackingNotes: number; reminders: number };
};

/** Projet encore « vierge » : aucune facture, note ni rappel, toujours à sa première étape. */
export function isUntouchedProject(p: ProjectForCheck): boolean {
  return (
    p._count.invoices === 0 &&
    p._count.trackingNotes === 0 &&
    p._count.reminders === 0 &&
    p.currentStep === resolveSteps(p.serviceType, p.steps)[0]
  );
}

const projectCheckSelect = {
  id: true,
  serviceType: true,
  steps: true,
  currentStep: true,
  _count: {
    select: {
      invoices: { where: { deletedAt: null } },
      trackingNotes: true,
      reminders: true,
    },
  },
} as const;

export type CancelResult = { hidden: number; kept: number };

/** Masque les projets vierges créés par ce devis ; garde (et compte) ceux déjà travaillés. */
async function hideAutoProjects(where: { quoteRequestId?: string; clientId?: string; createdFrom: string }) {
  const projects = await prismaRaw.project.findMany({ where: { ...where, deletedAt: null }, select: projectCheckSelect });
  const at = new Date();
  let hidden = 0;
  for (const p of projects) {
    if (isUntouchedProject(p)) {
      await trashProject(p.id, at, DEVIS_ANNULE);
      hidden++;
    }
  }
  return { hidden, kept: projects.length - hidden };
}

/** Demande de devis qui quitte « Devis accepté ». */
export async function cancelQuoteAcceptance(quoteRequestId: string): Promise<CancelResult> {
  return hideAutoProjects({ quoteRequestId, createdFrom: CREATED_FROM_QUOTE });
}

/**
 * Demande de devis qui passe (ou repasse) à « Devis accepté » : réaffiche les projets masqués
 * par une annulation, puis crée ceux qui manquent — jamais de doublon.
 */
export async function acceptQuoteRequest(quoteRequest: {
  id: string;
  clientId: string;
  label: string | null;
  serviceTypes: ServiceType[];
  potentialRevenue: number | null;
  createdAt: Date;
}) {
  await prismaRaw.$transaction(async (tx) => {
    const hiddenByCancel = await tx.project.findMany({
      where: { quoteRequestId: quoteRequest.id, deletedReason: DEVIS_ANNULE, deletedAt: { not: null } },
      select: { id: true, deletedAt: true },
    });
    for (const p of hiddenByCancel) {
      await tx.project.update({ where: { id: p.id }, data: { deletedAt: null, deletedReason: null } });
      await tx.invoice.updateMany({ where: { projectId: p.id, deletedAt: p.deletedAt }, data: { deletedAt: null } });
    }

    const existing = await tx.project.findMany({
      where: {
        deletedAt: null,
        OR: [
          { quoteRequestId: quoteRequest.id },
          // Projets créés avant le 27/11/2026 (sans lien) : même client, même nom, depuis la demande.
          {
            quoteRequestId: null,
            clientId: quoteRequest.clientId,
            name: quoteRequest.label,
            createdAt: { gte: quoteRequest.createdAt },
          },
        ],
      },
      select: { serviceType: true },
    });
    const already = new Set(existing.map((p) => p.serviceType));
    const isFirstCreation = already.size === 0;
    for (const [index, serviceType] of quoteRequest.serviceTypes.entries()) {
      if (already.has(serviceType)) continue;
      await tx.project.create({
        data: {
          clientId: quoteRequest.clientId,
          serviceType,
          name: quoteRequest.label,
          currentStep: projectSteps[serviceType][0],
          startDate: new Date(),
          quoteAmount: index === 0 && isFirstCreation ? quoteRequest.potentialRevenue : null,
          createdFrom: CREATED_FROM_QUOTE,
          quoteRequestId: quoteRequest.id,
        },
      });
    }
  });
}

/**
 * Marque qui quitte « Devis accepté » : masque ses projets créés automatiquement et encore
 * vierges, puis le client lui-même s'il n'a plus rien de visible (ni projet ni demande de devis).
 */
export async function cancelBrandAcceptance(brandId: string): Promise<CancelResult> {
  const client = await prisma.client.findUnique({ where: { brandId } });
  if (!client) return { hidden: 0, kept: 0 };
  const result = await hideAutoProjects({ clientId: client.id, createdFrom: CREATED_FROM_BRAND });
  const [projects, quoteRequests] = await Promise.all([
    prisma.project.count({ where: { clientId: client.id } }),
    prisma.quoteRequest.count({ where: { clientId: client.id } }),
  ]);
  if (projects === 0 && quoteRequests === 0) {
    await prismaRaw.client.update({ where: { id: client.id }, data: { deletedAt: new Date(), deletedReason: DEVIS_ANNULE } });
  }
  return result;
}

/** A-t-on quitté « Devis accepté » ? */
export function leavesAccepted(previous: PipelineStatus | null | undefined, next: PipelineStatus | null | undefined) {
  return previous === "DEVIS_ACCEPTE" && !!next && next !== "DEVIS_ACCEPTE";
}
