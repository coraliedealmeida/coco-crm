import { NextRequest, NextResponse } from "next/server";
import { PipelineStatus, ServiceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { archivingStatuses, statusLabel } from "@/lib/pipeline";
import { computeNextActionDate, statusActionType } from "@/lib/statusEffects";
import { projectSteps } from "@/lib/serviceTypes";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const brand = await prisma.brand.findUnique({
    where: { id: params.id },
    include: { contactHistory: { orderBy: { date: "desc" } } },
  });

  if (!brand) return NextResponse.json({ error: "Marque introuvable." }, { status: 404 });
  return NextResponse.json(brand);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const existingClient = await prisma.client.findUnique({ where: { brandId: params.id } });
  if (existingClient) {
    return NextResponse.json(
      { error: "Cette marque a un client et des projets associés : elle ne peut pas être supprimée." },
      { status: 409 }
    );
  }

  await prisma.$transaction([
    prisma.reminder.deleteMany({ where: { brandId: params.id } }),
    prisma.contactHistoryEntry.deleteMany({ where: { brandId: params.id } }),
    prisma.brand.delete({ where: { id: params.id } }),
  ]);

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();

  const data: Record<string, unknown> = {};
  for (const key of [
    "name",
    "emoji",
    "platform",
    "sector",
    "source",
    "notes",
    "contactName",
    "contactRole",
    "messageUsed",
    "pipelineStatus",
  ]) {
    if (key in body) data[key] = body[key];
  }
  if ("potentialRevenue" in body) {
    data.potentialRevenue = body.potentialRevenue != null ? Number(body.potentialRevenue) : null;
  }
  if ("engagementStartDate" in body) data.engagementStartDate = new Date(body.engagementStartDate);
  if ("lastContactDate" in body) data.lastContactDate = body.lastContactDate ? new Date(body.lastContactDate) : null;
  if ("nextActionDate" in body) data.nextActionDate = body.nextActionDate ? new Date(body.nextActionDate) : null;

  const now = new Date();
  let logType: string | null = null;

  if ("pipelineStatus" in body) {
    const newStatus = body.pipelineStatus as PipelineStatus;
    data.archivedAt = archivingStatuses.includes(newStatus) ? now : null;
    data.lastContactDate = now;
    logType = statusActionType[newStatus] ?? `Statut → ${statusLabel(newStatus)}`;

    if (!("nextActionDate" in body)) {
      const settings = await prisma.settings.upsert({
        where: { id: "singleton" },
        update: {},
        create: { id: "singleton" },
      });
      const computed = computeNextActionDate(newStatus, now, settings);
      if (computed !== undefined) data.nextActionDate = computed;
    }
  }

  const brand = await prisma.brand.update({
    where: { id: params.id },
    data,
  });

  if (logType) {
    await prisma.contactHistoryEntry.create({
      data: { brandId: brand.id, date: now, type: logType },
    });
  }

  if (body.pipelineStatus === "DEVIS_ACCEPTE") {
    await createClientAndProjectsIfNeeded(brand.id, brand.discoveryNotes, brand.potentialRevenue);
  }

  return NextResponse.json(brand);
}

/**
 * Transition prospect → client : à la première fois qu'une marque passe en "Devis accepté",
 * on crée le Client et un Project par type de prestation coché en Section 3 des notes
 * d'appel découverte (chaque type a son propre workflow d'étapes, cf. lib/serviceTypes.ts).
 * Le montant du devis n'est pas réparti automatiquement entre les projets (pas de mapping
 * fiable prestation ↔ ligne de facturation) : il est posé sur le premier projet, à ajuster
 * manuellement ensuite depuis la fiche projet.
 */
async function createClientAndProjectsIfNeeded(
  brandId: string,
  discoveryNotes: unknown,
  potentialRevenue: number | null
) {
  const existingClient = await prisma.client.findUnique({ where: { brandId } });
  if (existingClient) return;

  const notes = (discoveryNotes as { serviceTypes?: ServiceType[] } | null) ?? null;
  const serviceTypes = Array.isArray(notes?.serviceTypes) ? notes!.serviceTypes : [];
  if (serviceTypes.length === 0) return;

  // Transaction : soit le client et tous ses projets sont créés ensemble, soit rien ne l'est
  // (évite un client orphelin sans projet si une des créations échoue en cours de route).
  await prisma.$transaction(async (tx) => {
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
  });
}
