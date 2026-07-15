import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const bundles = await prisma.bundle.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(bundles);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, discountPercent, serviceIds, description } = body;
  if (!name || !Array.isArray(serviceIds) || serviceIds.length < 2) {
    return NextResponse.json({ error: "Un bundle nécessite un nom et au moins 2 prestations." }, { status: 400 });
  }
  const bundle = await prisma.bundle.create({
    data: { name, discountPercent: discountPercent ?? 10, serviceIds, description: description ?? null },
  });
  return NextResponse.json(bundle, { status: 201 });
}
