import { NextRequest, NextResponse } from "next/server";
import { PipelineStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { archivingStatuses, statusLabel } from "@/lib/pipeline";
import { computeNextActionDate, statusActionType } from "@/lib/statusEffects";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const brand = await prisma.brand.findUnique({
    where: { id: params.id },
    include: { contactHistory: { orderBy: { date: "desc" } } },
  });

  if (!brand) return NextResponse.json({ error: "Marque introuvable." }, { status: 404 });
  return NextResponse.json(brand);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();

  const data: Record<string, unknown> = {};
  for (const key of [
    "name",
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

  return NextResponse.json(brand);
}
