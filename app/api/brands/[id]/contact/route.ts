import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PipelineStatus } from "@prisma/client";
import { archivingStatuses } from "@/lib/pipeline";
import { computeNextActionDate } from "@/lib/statusEffects";

const statusForType: Partial<Record<string, PipelineStatus>> = {
  "Premier DM": "PREMIER_DM",
  "Relance 1": "RELANCE_1",
  "Relance 2": "RELANCE_2",
  "Réponse reçue": "EN_DISCUSSION",
  "Appel prévu": "APPEL_PREVU",
  "Appel réalisé": "DEVIS_A_FAIRE",
  "Devis envoyé": "DEVIS_ENVOYE",
  "Relance devis 1": "RELANCE_DEVIS_1",
  "Relance devis 2": "RELANCE_DEVIS_2",
  "Devis refusé": "DEVIS_REFUSE",
};

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
  const nextStatus = statusForType[type];
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
