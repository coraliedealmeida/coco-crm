import { NextRequest, NextResponse } from "next/server";
import { PipelineStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeNextActionDate, statusActionType } from "@/lib/statusEffects";
import { statusLabel } from "@/lib/pipeline";
import { requireSession } from "@/lib/apiAuth";
import { acceptQuoteRequest, cancelQuoteAcceptance, leavesAccepted, trashQuoteRequest } from "@/lib/trash";
import { getSettings } from "@/lib/settings";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireSession();
  if (denied) return denied;

  const body = await request.json();
  const data: Record<string, unknown> = {};

  if ("label" in body) data.label = body.label?.trim() || null;
  if ("potentialRevenue" in body) {
    data.potentialRevenue = body.potentialRevenue != null ? Number(body.potentialRevenue) : null;
  }
  if ("serviceTypes" in body) data.serviceTypes = body.serviceTypes;
  if ("reconsiderDate" in body) data.reconsiderDate = body.reconsiderDate ? new Date(body.reconsiderDate) : null;

  const now = new Date();
  let logType: string | null = null;

  // Statut avant modification : sert au garde-fou anti-doublons de projets (plus bas).
  let previousStatus: PipelineStatus | null = null;

  if ("status" in body) {
    const newStatus = body.status as PipelineStatus;
    const before = await prisma.quoteRequest.findUnique({ where: { id: params.id }, select: { status: true } });
    previousStatus = before?.status ?? null;
    data.status = newStatus;
    data.lastContactDate = now;
    logType = statusActionType[newStatus] ?? `Statut → ${statusLabel(newStatus)}`;

    const settings = await getSettings();
    const computed = computeNextActionDate(newStatus, now, settings);
    if (computed !== undefined) data.nextActionDate = computed;
  } else if ("lastContactDate" in body) {
    // Correction manuelle de la date (ex : devis en réalité envoyé plus tôt que la date système
    // enregistrée automatiquement) : on recalcule la relance à partir de cette date corrigée,
    // pas de la date du jour, sinon la relance se déclenche trop tard.
    const correctedDate = new Date(body.lastContactDate);
    data.lastContactDate = correctedDate;

    const current = await prisma.quoteRequest.findUniqueOrThrow({ where: { id: params.id } });
    const settings = await getSettings();
    const computed = computeNextActionDate(current.status, correctedDate, settings);
    if (computed !== undefined) data.nextActionDate = computed;
  }

  const quoteRequest = await prisma.quoteRequest.update({
    where: { id: params.id },
    data,
    include: { client: { include: { brand: true } } },
  });

  if (logType) {
    await prisma.contactHistoryEntry.create({
      data: { brandId: quoteRequest.client.brand.id, date: now, type: logType },
    });
  }

  // Passage à « Devis accepté » : réaffiche les projets masqués par une annulation, crée ceux
  // qui manquent, jamais de doublon (lib/trash.ts).
  if (body.status === "DEVIS_ACCEPTE" && previousStatus !== "DEVIS_ACCEPTE") {
    await acceptQuoteRequest(quoteRequest);
  }

  // « Devis accepté » annulé : les projets créés automatiquement et encore vierges sont masqués.
  if (leavesAccepted(previousStatus, body.status)) {
    const result = await cancelQuoteAcceptance(quoteRequest.id);
    return NextResponse.json({ ...quoteRequest, projectsHidden: result.hidden, projectsKept: result.kept });
  }

  return NextResponse.json(quoteRequest);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireSession();
  if (denied) return denied;

  // Corbeille : masquée, restaurable (ses projets éventuels restent en place).
  await trashQuoteRequest(params.id);
  return NextResponse.json({ ok: true });
}
