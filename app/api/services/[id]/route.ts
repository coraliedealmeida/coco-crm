import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  const { name, category, price, priceType, content, active, order } = body;
  const service = await prisma.service.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(price !== undefined ? { price } : {}),
      ...(priceType !== undefined ? { priceType } : {}),
      ...(content !== undefined ? { content } : {}),
      ...(active !== undefined ? { active } : {}),
      ...(order !== undefined ? { order } : {}),
    },
  });
  return NextResponse.json(service);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const usedInBundle = await prisma.bundle.findFirst({ where: { serviceIds: { has: params.id } } });
  if (usedInBundle) {
    return NextResponse.json(
      { error: `Cette prestation fait partie du bundle "${usedInBundle.name}". Retirez-la du bundle avant de la supprimer.` },
      { status: 409 }
    );
  }
  await prisma.service.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
