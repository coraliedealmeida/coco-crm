import { NextRequest, NextResponse } from "next/server";
import { ServiceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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
