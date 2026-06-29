import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { archivingStatuses } from "@/lib/pipeline";
import { computeNextActionDate, statusForActionType } from "@/lib/statusEffects";

/**
 * Journalise un contact (premier DM, relance, appel, etc.) et fait avancer
 * automatiquement le statut + calcule la prochaine date d'action.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  const { type, content } = body as { type: string; content?: string };

  const settings = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  const now = new Date();
  const nextStatus = statusForActionType[type];
  const nextActionDate = nextStatus ? computeNextActionDate(nextStatus, now, settings) : undefined;

  await prisma.contactHistoryEntry.create({
    data: { brandId: params.id, date: now, type, content: content || null },
  });

  const brand = await prisma.brand.update({
    where: { id: params.id },
    data: {
      lastContactDate: now,
      ...(nextStatus ? { pipelineStatus: nextStatus } : {}),
      ...(nextStatus ? { archivedAt: archivingStatuses.includes(nextStatus) ? now : null } : {}),
      ...(nextActionDate !== undefined ? { nextActionDate } : {}),
    },
  });

  return NextResponse.json(brand);
}
