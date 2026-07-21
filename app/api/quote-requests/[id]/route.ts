import { NextRequest, NextResponse } from "next/server";
import { PipelineStatus, ServiceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeNextActionDate, statusActionType } from "@/lib/statusEffects";
import { statusLabel } from "@/lib/pipeline";
import { projectSteps } from "@/lib/serviceTypes";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  const data: Record<string, unknown> = {};

  if ("label" in body) data.label = body.label?.trim() || null;
  if ("potentialRevenue" in body) {
    data.potentialRevenue = body.potentialRevenue != null ? Number(body.potentialRevenue) : null;
  }
  if ("serviceTypes" in body) data.serviceTypes = body.serviceTypes;

  const now = new Date();
  let logType: string | null = null;

  if ("status" in body) {
    const newStatus = body.status as PipelineStatus;
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

  if (body.status === "DEVIS_ACCEPTE") {
    const serviceTypes = (quoteRequest.serviceTypes ?? []) as ServiceType[];
    for (const [index, serviceType] of serviceTypes.entries()) {
      await prisma.project.create({
        data: {
          clientId: quoteRequest.clientId,
          serviceType,
          name: quoteRequest.label,
          currentStep: projectSteps[serviceType][0],
          quoteAmount: index === 0 ? quoteRequest.potentialRevenue : null,
        },
      });
    }
  }

  return NextResponse.json(quoteRequest);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  await prisma.quoteRequest.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
