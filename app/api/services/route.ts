import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/apiAuth";

export async function GET() {
  const denied = await requireSession();
  if (denied) return denied;

  const services = await prisma.service.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(services);
}

export async function POST(request: NextRequest) {
  const denied = await requireSession();
  if (denied) return denied;

  const body = await request.json();
  const { name, category, price, priceType, content } = body;
  if (!name || !category || typeof price !== "number") {
    return NextResponse.json({ error: "Champs invalides." }, { status: 400 });
  }
  const last = await prisma.service.findFirst({ orderBy: { order: "desc" } });
  const service = await prisma.service.create({
    data: {
      name,
      category,
      price,
      priceType: priceType ?? "FIXED",
      content: content ?? null,
      order: (last?.order ?? -1) + 1,
    },
  });
  return NextResponse.json(service, { status: 201 });
}
