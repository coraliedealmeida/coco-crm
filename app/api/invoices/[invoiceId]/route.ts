import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/apiAuth";
import { trashInvoice } from "@/lib/trash";

export async function PATCH(request: NextRequest, { params }: { params: { invoiceId: string } }) {
  const denied = await requireSession();
  if (denied) return denied;

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
  const denied = await requireSession();
  if (denied) return denied;

  // Corbeille : la facture est masquée et ne compte plus dans les totaux, mais reste restaurable.
  await trashInvoice(params.invoiceId);
  return NextResponse.json({ ok: true });
}
