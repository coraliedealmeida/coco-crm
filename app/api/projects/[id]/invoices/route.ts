import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { label, amount } = await request.json();
  if (!label || typeof amount !== "number") {
    return NextResponse.json({ error: "Libellé et montant requis." }, { status: 400 });
  }
  const invoice = await prisma.invoice.create({
    data: { projectId: params.id, label, amount },
  });
  return NextResponse.json(invoice, { status: 201 });
}
