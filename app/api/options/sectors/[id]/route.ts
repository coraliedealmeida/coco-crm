import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/apiAuth";

export async function DELETE(_request: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  const denied = await requireSession();
  if (denied) return denied;

  await prisma.sectorOption.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
