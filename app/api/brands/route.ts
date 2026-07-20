import { NextRequest, NextResponse } from "next/server";
import { PipelineStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeNextActionDate } from "@/lib/statusEffects";

export async function GET() {
  const brands = await prisma.brand.findMany({
    orderBy: { createdAt: "desc" },
    include: { contactHistory: { orderBy: { date: "desc" } } },
  });
  return NextResponse.json(brands);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const pipelineStatus = (body.pipelineStatus ?? "ROUTINE_ENGAGEMENT") as PipelineStatus;
  const now = new Date();

  // Hors routine d'engagement, la marque entre directement dans le suivi habituel du Pipeline :
  // on pose donc un premier "dernier contact" et on calcule la prochaine action comme le ferait
  // un changement de statut, pour que la carte affiche ces informations dès la création.
  let nextActionDate: Date | null = null;
  if (pipelineStatus !== "ROUTINE_ENGAGEMENT") {
    const settings = await prisma.settings.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
    });
    const computed = computeNextActionDate(pipelineStatus, now, settings);
    nextActionDate = computed ?? null;
  }

  const brand = await prisma.brand.create({
    data: {
      name: body.name,
      emoji: body.emoji || null,
      platform: body.platform,
      acquisitionPath: body.acquisitionPath ?? null,
      sector: body.sector,
      source: body.source,
      notes: body.notes || null,
      engagementStartDate: new Date(body.engagementStartDate),
      pipelineStatus,
      lastContactDate: pipelineStatus === "ROUTINE_ENGAGEMENT" ? null : now,
      nextActionDate,
      contactName: body.contactName || null,
      contactRole: body.contactRole || null,
      potentialRevenue: body.potentialRevenue != null ? Number(body.potentialRevenue) : null,
    },
  });

  await prisma.contactHistoryEntry.create({
    data: {
      brandId: brand.id,
      date: new Date(),
      type: pipelineStatus === "ROUTINE_ENGAGEMENT" ? "Routine d'engagement démarrée" : "Marque créée",
    },
  });

  return NextResponse.json(brand, { status: 201 });
}
