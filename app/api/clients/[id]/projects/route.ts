import { NextRequest, NextResponse } from "next/server";
import { ServiceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { projectSteps } from "@/lib/serviceTypes";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { serviceType } = (await request.json()) as { serviceType: ServiceType };
  if (!serviceType || !(serviceType in projectSteps)) {
    return NextResponse.json({ error: "Type de prestation invalide." }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      clientId: params.id,
      serviceType,
      currentStep: projectSteps[serviceType][0],
    },
  });

  return NextResponse.json(project, { status: 201 });
}
