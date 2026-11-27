import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/apiAuth";

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireSession();
  if (denied) return denied;

  await prisma.sourceOption.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
