import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const options = await prisma.sourceOption.findMany({ orderBy: { label: "asc" } });
  return NextResponse.json(options);
}

export async function POST(request: NextRequest) {
  const { label } = await request.json();
  if (!label || typeof label !== "string") {
    return NextResponse.json({ error: "Valeur invalide." }, { status: 400 });
  }
  const option = await prisma.sourceOption.upsert({
    where: { label },
    update: {},
    create: { label },
  });
  return NextResponse.json(option, { status: 201 });
}
