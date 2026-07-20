import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DATE_FIELDS = ["signedAt", "startDate", "estimatedDeliveryDate"] as const;

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  const data: Record<string, unknown> = {};

  for (const key of ["currentStep", "notes"]) {
    if (key in body) data[key] = body[key];
  }
  if ("steps" in body && Array.isArray(body.steps)) data.steps = body.steps;
  if ("quoteAmount" in body) data.quoteAmount = body.quoteAmount != null ? Number(body.quoteAmount) : null;
  for (const key of DATE_FIELDS) {
    if (key in body) data[key] = body[key] ? new Date(body[key]) : null;
  }

  const project = await prisma.project.update({ where: { id: params.id }, data });
  return NextResponse.json(project);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  await prisma.project.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
