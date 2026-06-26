import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  await prisma.sourceOption.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
