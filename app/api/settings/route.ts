import { NextRequest, NextResponse } from "next/server";
import { PipelineStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeNextActionDate } from "@/lib/statusEffects";

// Statuts dont la prochaine relance (nextActionDate) est calculée à partir d'un nombre de
// jours réglable dans les Paramètres. Les autres statuts ne dépendent d'aucun réglage
// (computeNextActionDate y renvoie null/undefined) et n'ont donc rien à recalculer.
const RECOMPUTE_STATUSES: PipelineStatus[] = ["PREMIER_DM", "RELANCE_1", "DEVIS_ENVOYE", "RELANCE_DEVIS_1"];

export async function GET() {
  const settings = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
  return NextResponse.json(settings);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const data: Record<string, unknown> = {};
  for (const key of [
    "daysBeforeGreenLight",
    "daysBeforeRelance1",
    "daysBeforeRelance2",
    "daysBeforeDevisRelance1",
    "daysBeforeDevisRelance2",
    "daysBeforeFactureRelance1",
    "daysBeforeFactureRelance2",
    "daysBetweenEngagements",
    "emailNotifications",
  ]) {
    if (key in body) data[key] = body[key];
  }

  const settings = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });

  // Applique immédiatement la nouvelle cadence aux marques/devis déjà engagés, pas seulement
  // aux prochains statuts posés : sans ça, une marque déjà en "Devis envoyé" garde sa date de
  // relance calculée avec l'ancien réglage jusqu'au prochain changement de statut.
  const [brandsToRecompute, quoteRequestsToRecompute] = await Promise.all([
    prisma.brand.findMany({
      where: { pipelineStatus: { in: RECOMPUTE_STATUSES }, lastContactDate: { not: null } },
      select: { id: true, pipelineStatus: true, lastContactDate: true },
    }),
    prisma.quoteRequest.findMany({
      where: { status: { in: RECOMPUTE_STATUSES }, lastContactDate: { not: null } },
      select: { id: true, status: true, lastContactDate: true },
    }),
  ]);

  await Promise.all([
    ...brandsToRecompute.map((b) => {
      const computed = computeNextActionDate(b.pipelineStatus, b.lastContactDate!, settings);
      return computed === undefined
        ? null
        : prisma.brand.update({ where: { id: b.id }, data: { nextActionDate: computed } });
    }),
    ...quoteRequestsToRecompute.map((q) => {
      const computed = computeNextActionDate(q.status, q.lastContactDate!, settings);
      return computed === undefined
        ? null
        : prisma.quoteRequest.update({ where: { id: q.id }, data: { nextActionDate: computed } });
    }),
  ]);

  return NextResponse.json(settings);
}
