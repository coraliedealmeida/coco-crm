import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeNextActionDate, statusForActionType } from "@/lib/statusEffects";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; entryId: string } }
) {
  const { date } = await request.json();
  if (!date) return NextResponse.json({ error: "Date requise." }, { status: 400 });

  const newDate = new Date(date);

  const [entry, latestEntry] = await Promise.all([
    prisma.contactHistoryEntry.findUnique({ where: { id: params.entryId } }),
    prisma.contactHistoryEntry.findFirst({
      where: { brandId: params.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!entry) return NextResponse.json({ error: "Entrée introuvable." }, { status: 404 });

  const updatedEntry = await prisma.contactHistoryEntry.update({
    where: { id: params.entryId },
    data: { date: newDate },
  });

  // Si c'est la dernière action enregistrée, elle a déterminé le statut actuel
  // et la prochaine action : on recalcule cette dernière à partir de la date corrigée.
  if (latestEntry?.id === params.entryId) {
    const mappedStatus = statusForActionType[entry.type];
    if (mappedStatus) {
      const settings = await prisma.settings.upsert({
        where: { id: "singleton" },
        update: {},
        create: { id: "singleton" },
      });
      const nextActionDate = computeNextActionDate(mappedStatus, newDate, settings);

      await prisma.brand.update({
        where: { id: params.id },
        data: {
          lastContactDate: newDate,
          ...(nextActionDate !== undefined ? { nextActionDate } : {}),
        },
      });
    }
  }

  return NextResponse.json(updatedEntry);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; entryId: string } }
) {
  await prisma.contactHistoryEntry.delete({ where: { id: params.entryId } });
  return NextResponse.json({ ok: true });
}
