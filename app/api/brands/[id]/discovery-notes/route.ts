import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  const { computedTotal, ...notes } = body as { computedTotal?: number } & Record<string, unknown>;

  const brand = await prisma.brand.update({
    where: { id: params.id },
    data: {
      discoveryNotes: notes as Prisma.InputJsonValue,
      ...(typeof computedTotal === "number" ? { potentialRevenue: computedTotal } : {}),
    },
  });

  return NextResponse.json(brand);
}
