import { NextRequest, NextResponse } from "next/server";
import { ServiceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/apiAuth";

export async function POST(request: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  const denied = await requireSession();
  if (denied) return denied;

  const { label, serviceTypes, potentialRevenue } = (await request.json()) as {
    label?: string;
    serviceTypes?: ServiceType[];
    potentialRevenue?: number | null;
  };

  const quoteRequest = await prisma.quoteRequest.create({
    data: {
      clientId: params.id,
      label: label?.trim() || null,
      serviceTypes: Array.isArray(serviceTypes) ? serviceTypes : [],
      potentialRevenue: potentialRevenue ?? null,
      lastContactDate: new Date(),
    },
  });

  return NextResponse.json(quoteRequest, { status: 201 });
}
