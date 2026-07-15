import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  await prisma.bundle.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
