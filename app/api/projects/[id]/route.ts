import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { projectSteps } from "@/lib/serviceTypes";
import { computeInvoiceDates } from "@/lib/projects";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  const data: Record<string, unknown> = {};

  for (const key of ["currentStep", "notes"]) {
    if (key in body) data[key] = body[key];
  }
  if ("revisionCount" in body) data.revisionCount = Number(body.revisionCount);
  if ("quoteAmount" in body) data.quoteAmount = body.quoteAmount != null ? Number(body.quoteAmount) : null;
  if ("startDate" in body) data.startDate = body.startDate ? new Date(body.startDate) : null;
  if ("estimatedDeliveryDate" in body) {
    data.estimatedDeliveryDate = body.estimatedDeliveryDate ? new Date(body.estimatedDeliveryDate) : null;
  }

  if (typeof body.currentStep === "string") {
    const existing = await prisma.project.findUnique({ where: { id: params.id } });
    if (existing) {
      const stamps = computeInvoiceDates(projectSteps[existing.serviceType], body.currentStep, {
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
