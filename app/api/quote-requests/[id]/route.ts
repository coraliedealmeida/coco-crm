import { NextRequest, NextResponse } from "next/server";
import { PipelineStatus, ServiceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeNextActionDate, statusActionType } from "@/lib/statusEffects";
import { statusLabel } from "@/lib/pipeline";
import { projectSteps } from "@/lib/serviceTypes";
import { requireSession } from "@/lib/apiAuth";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireSession();
  if (denied) return denied;

  const body = await request.json();
  const data: Record<string, unknown> = {};

  if ("label" in body) data.label = body.label?.trim() || null;
  if ("potentialRevenue" in body) {
    data.potentialRevenue = body.potentialRevenue != null ? Number(body.potentialRevenue) : null;
  }
  if ("serviceTypes" in body) data.serviceTypes = body.serviceTypes;
  if ("reconsiderDate" in body) data.reconsiderDate = body.reconsiderDate ? new Date(body.reconsiderDate) : null;

  const now = new Date();
  let logType: string | null = null;

  // Statut avant modification : sert au garde-fou anti-doublons de projets (plus bas).
  let previousStatus: PipelineStatus | null = null;

  if ("status" in body) {
    const newStatus = body.status as PipelineStatus;
    const before = await prisma.quoteRequest.findUnique({ where: { id: params.id }, select: { status: true } });
    previousStatus = before?.status ?? null;
    data.status = newStatus;
    data.lastContactDate = now;
    logType = statusActionType[newStatus] ?? `Statut → ${statusLabel(newStatus)}`;

    const settings = await prisma.settings.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
    });
    const computed = computeNextActionDate(newStatus, now, settings);
    if (computed !== undefined) data.nextActionDate = computed;
  } else if ("lastContactDate" in body) {
    // Correction manuelle de la date (ex : devis en réalité envoyé plus tôt que la date système
    // enregistrée automatiquement) : on recalcule la relance à partir de cette date corrigée,
    // pas de la date du jour, sinon la relance se déclenche trop tard.
    const correctedDate = new Date(body.lastContactDate);
    data.lastContactDate = correctedDate;

    const current = await prisma.quoteRequest.findUniqueOrThrow({ where: { id: params.id } });
    const settings = await prisma.settings.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
    });
    const computed = computeNextActionDate(current.status, correctedDate, settings);
    if (computed !== undefined) data.nextActionDate = computed;
  }

  const quoteRequest = await prisma.quoteRequest.update({
    where: { id: params.id },
    data,
    include: { client: { include: { brand: true } } },
  });

  if (logType) {
    await prisma.contactHistoryEntry.create({
      data: { brandId: quoteRequest.client.brand.id, date: now, type: logType },
    });
  }

  // Garde-fou anti-doublons : les projets ne sont créés qu'au PASSAGE à « Devis accepté »
  // (pas si la demande y était déjà), et jamais pour un type de prestation dont le projet
  // existe déjà (même client, même nom, créé depuis cette demande). Avant, repasser une demande
  // à « Devis accepté » après une erreur de statut recréait tous ses projets.
  if (body.status === "DEVIS_ACCEPTE" && previousStatus !== "DEVIS_ACCEPTE") {
    const serviceTypes = (quoteRequest.serviceTypes ?? []) as ServiceType[];
    await prisma.$transaction(async (tx) => {
      const existing = await tx.project.findMany({
        where: {
          clientId: quoteRequest.clientId,
          name: quoteRequest.label,
          createdAt: { gte: quoteRequest.createdAt },
          serviceType: { in: serviceTypes },
        },
        select: { serviceType: true },
      });
      const alreadyCreated = new Set(existing.map((p) => p.serviceType));
      const hasAnyProject = alreadyCreated.size > 0;
      for (const [index, serviceType] of serviceTypes.entries()) {
        if (alreadyCreated.has(serviceType)) continue;
        await tx.project.create({
          data: {
            clientId: quoteRequest.clientId,
            serviceType,
            name: quoteRequest.label,
            currentStep: projectSteps[serviceType][0],
            startDate: now,
            quoteAmount: index === 0 && !hasAnyProject ? quoteRequest.potentialRevenue : null,
          },
        });
      }
    });
  }

  return NextResponse.json(quoteRequest);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireSession();
  if (denied) return denied;

  await prisma.quoteRequest.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
