import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

  if ("pipelineStatus" in body) {
    data.archivedAt = body.pipelineStatus === "ARCHIVE" ? new Date() : null;
  }

  const brand = await prisma.brand.update({
    where: { id: params.id },
    data,
  });

  if ("pipelineStatus" in body) {
    await prisma.contactHistoryEntry.create({
      data: {
        brandId: brand.id,
        date: new Date(),
        type: `Statut → ${body.pipelineStatus}`,
      },
    });
  }

  return NextResponse.json(brand);
}
