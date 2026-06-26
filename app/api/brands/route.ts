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

  const brand = await prisma.brand.create({
    data: {
      name: body.name,
      platform: body.platform,
      sector: body.sector,
      source: body.source,
      notes: body.notes || null,
      engagementStartDate: new Date(body.engagementStartDate),
      contactName: body.contactName || null,
      contactRole: body.contactRole || null,
      potentialRevenue: body.potentialRevenue != null ? Number(body.potentialRevenue) : null,
    },
  });

  await prisma.contactHistoryEntry.create({
    data: {
      brandId: brand.id,
      date: new Date(),
      type: "Routine d'engagement démarrée",
    },
  });

  return NextResponse.json(brand, { status: 201 });
}
