import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/apiAuth";

export async function PATCH(request: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  const denied = await requireSession();
  if (denied) return denied;

  const body = await request.json();
  const { name, discountPercent, serviceIds, description, active } = body;
  const bundle = await prisma.bundle.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(discountPercent !== undefined ? { discountPercent } : {}),
      ...(serviceIds !== undefined ? { serviceIds } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(active !== undefined ? { active } : {}),
    },
  });
  return NextResponse.json(bundle);
}

export async function DELETE(_request: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  const denied = await requireSession();
  if (denied) return denied;

  await prisma.bundle.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
