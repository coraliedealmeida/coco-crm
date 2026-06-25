import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addBusinessDays } from "@/lib/business-days";
import { PipelineStatus } from "@prisma/client";

/**
 * Journalise un contact (premier DM, relance, appel, etc.) et fait avancer
 * automatiquement le statut + calcule la prochaine date d'action.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  const { type, content } = body as { type: string; content?: string };

  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const delay1 = settings?.daysBeforeRelance1 ?? 15;
  const delay2 = settings?.daysBeforeRelance2 ?? 15;

  const now = new Date();
  let nextStatus: PipelineStatus | undefined;
  let nextActionDate: Date | null = null;

  if (type === "Premier DM") {
    nextStatus = "PREMIER_DM";
    nextActionDate = addBusinessDays(now, delay1);
  } else if (type === "Relance 1") {
    nextStatus = "RELANCE_1";
    nextActionDate = addBusinessDays(now, delay2);
  } else if (type === "Relance 2") {
    nextStatus = "RELANCE_2";
    nextActionDate = null;
  } else if (type === "Réponse reçue") {
    nextStatus = "EN_DISCUSSION";
  } else if (type === "Appel découverte") {
    nextStatus = "APPEL_PREVU";
  }

  await prisma.contactHistoryEntry.create({
    data: { brandId: params.id, date: now, type, content: content || null },
  });

  const brand = await prisma.brand.update({
    where: { id: params.id },
    data: {
      lastContactDate: now,
      ...(nextStatus ? { pipelineStatus: nextStatus } : {}),
      nextActionDate,
    },
  });

  return NextResponse.json(brand);
}
