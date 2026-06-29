import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();

  const brand = await prisma.brand.update({
    where: { id: params.id },
    data: { discoveryNotes: body },
  });

  return NextResponse.json(brand);
}
