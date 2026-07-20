import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const brands = await prisma.brand.findMany({
    orderBy: { createdAt: "desc" },
    include: { contactHistory: { orderBy: { date: "desc" } } },
  });
  return NextResponse.json(brands);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const pipelineStatus = body.pipelineStatus ?? "ROUTINE_ENGAGEMENT";

  const brand = await prisma.brand.create({
    data: {
      name: body.name,
      emoji: body.emoji || null,
      platform: body.platform,
      sector: body.sector,
      source: body.source,
      notes: body.notes || null,
      engagementStartDate: new Date(body.engagementStartDate),
      pipelineStatus,
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
