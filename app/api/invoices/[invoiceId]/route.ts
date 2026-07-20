import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, { params }: { params: { invoiceId: string } }) {
  const body = await request.json();
  const data: Record<string, unknown> = {};
  if ("label" in body) data.label = body.label;
  if ("amount" in body) data.amount = Number(body.amount);
  if ("sentAt" in body) data.sentAt = body.sentAt ? new Date(body.sentAt) : null;
  if ("paidAt" in body) data.paidAt = body.paidAt ? new Date(body.paidAt) : null;

  const invoice = await prisma.invoice.update({ where: { id: params.invoiceId }, data });
  return NextResponse.json(invoice);
}

export async function DELETE(_request: NextRequest, { params }: { params: { invoiceId: string } }) {
  await prisma.invoice.delete({ where: { id: params.invoiceId } });
  return NextResponse.json({ ok: true });
}
