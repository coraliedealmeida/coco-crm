import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeInvoiceDates, resolveSteps } from "@/lib/projects";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  const data: Record<string, unknown> = {};

  for (const key of ["currentStep", "notes"]) {
    if (key in body) data[key] = body[key];
  }
  if ("steps" in body && Array.isArray(body.steps)) data.steps = body.steps;
  if ("quoteAmount" in body) data.quoteAmount = body.quoteAmount != null ? Number(body.quoteAmount) : null;
  if ("startDate" in body) data.startDate = body.startDate ? new Date(body.startDate) : null;
  if ("estimatedDeliveryDate" in body) {
    data.estimatedDeliveryDate = body.estimatedDeliveryDate ? new Date(body.estimatedDeliveryDate) : null;
  }

  if (typeof body.currentStep === "string") {
    const existing = await prisma.project.findUnique({ where: { id: params.id } });
    if (existing) {
      const steps = resolveSteps(existing.serviceType, existing.steps);
      const stamps = computeInvoiceDates(steps, body.currentStep, {
        invoicedAt: existing.invoicedAt,
        paidAt: existing.paidAt,
      });
      Object.assign(data, stamps);
    }
  }

  const project = await prisma.project.update({ where: { id: params.id }, data });
  return NextResponse.json(project);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  await prisma.project.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
