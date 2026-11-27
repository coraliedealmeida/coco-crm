import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { archivingStatuses } from "@/lib/pipeline";
import { computeNextActionDate, statusForActionType } from "@/lib/statusEffects";
import { requireSession } from "@/lib/apiAuth";
import { cancelBrandAcceptance, leavesAccepted } from "@/lib/trash";

/**
 * Journalise un contact (premier DM, relance, appel, etc.) et fait avancer
 * automatiquement le statut + calcule la prochaine date d'action.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireSession();
  if (denied) return denied;

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

  const before = await prisma.brand.findUnique({ where: { id: params.id }, select: { pipelineStatus: true } });

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

  // Ex. « Devis refusé » après un « Devis accepté » : mêmes règles que dans le Pipeline.
  if (leavesAccepted(before?.pipelineStatus, nextStatus)) {
    const result = await cancelBrandAcceptance(brand.id);
    return NextResponse.json({ ...brand, projectsHidden: result.hidden, projectsKept: result.kept });
  }

  return NextResponse.json(brand);
}
