import { NextRequest, NextResponse } from "next/server";
import { PipelineStatus } from "@prisma/client";
import { prisma, NOT_DELETED } from "@/lib/prisma";
import { archivingStatuses, statusLabel } from "@/lib/pipeline";
import { computeNextActionDate, statusActionType } from "@/lib/statusEffects";
import { ensureClientAndProjects } from "@/lib/clientTransition";
import { requireSession } from "@/lib/apiAuth";
import { cancelBrandAcceptance, leavesAccepted, trashBrand } from "@/lib/trash";
import { getSettings } from "@/lib/settings";

export async function GET(_request: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  const denied = await requireSession();
  if (denied) return denied;

  const brand = await prisma.brand.findUnique({
    where: { id: params.id },
    include: { contactHistory: { orderBy: { date: "desc" } } },
  });

  if (!brand) return NextResponse.json({ error: "Marque introuvable." }, { status: 404 });
  return NextResponse.json(brand);
}

export async function DELETE(request: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  const denied = await requireSession();
  if (denied) return denied;

  const force = request.nextUrl.searchParams.get("force") === "true";

  const client = await prisma.client.findUnique({
    where: { brandId: params.id },
    include: { projects: { where: NOT_DELETED, include: { invoices: { where: NOT_DELETED } } } },
  });

  if (client && !force) {
    return NextResponse.json(
      {
        error: "Cette marque a un client associé.",
        hasClient: true,
        projectCount: client.projects.length,
        invoiceCount: client.projects.reduce((sum, p) => sum + p.invoices.length, 0),
      },
      { status: 409 }
    );
  }

  // Corbeille : la marque, son client, ses projets, factures et demandes de devis sont masqués
  // ensemble (jamais effacés) et restaurables ensemble depuis Paramètres → Corbeille.
  await trashBrand(params.id);

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  const denied = await requireSession();
  if (denied) return denied;

  const body = await request.json();

  const data: Record<string, unknown> = {};
  for (const key of [
    "name",
    "emoji",
    "platform",
    "acquisitionPath",
    "sector",
    "source",
    "notes",
    "contactName",
    "contactRole",
    "messageUsed",
    "pipelineStatus",
  ]) {
    if (key in body) data[key] = body[key];
  }
  if ("potentialRevenue" in body) {
    data.potentialRevenue = body.potentialRevenue != null ? Number(body.potentialRevenue) : null;
  }
  if ("engagementStartDate" in body) data.engagementStartDate = new Date(body.engagementStartDate);
  if ("lastContactDate" in body) data.lastContactDate = body.lastContactDate ? new Date(body.lastContactDate) : null;
  if ("nextActionDate" in body) data.nextActionDate = body.nextActionDate ? new Date(body.nextActionDate) : null;
  if ("reconsiderDate" in body) data.reconsiderDate = body.reconsiderDate ? new Date(body.reconsiderDate) : null;
  if ("lastEngagementAt" in body) data.lastEngagementAt = body.lastEngagementAt ? new Date(body.lastEngagementAt) : null;
  if (body.lastEngagementAt) data.engagementCount = { increment: 1 };
  if ("lastEngagementContactIndex" in body) data.lastEngagementContactIndex = body.lastEngagementContactIndex;

  const now = new Date();
  let logType: string | null = null;

  // Statut avant modification : sert à détecter l'annulation d'un « Devis accepté ».
  let previousStatus: PipelineStatus | null = null;

  if ("pipelineStatus" in body) {
    const newStatus = body.pipelineStatus as PipelineStatus;
    const before = await prisma.brand.findUnique({ where: { id: params.id }, select: { pipelineStatus: true } });
    previousStatus = before?.pipelineStatus ?? null;
    data.archivedAt = archivingStatuses.includes(newStatus) ? now : null;
    data.lastContactDate = now;
    logType = statusActionType[newStatus] ?? `Statut → ${statusLabel(newStatus)}`;

    if (!("nextActionDate" in body)) {
      const settings = await getSettings();
      const computed = computeNextActionDate(newStatus, now, settings);
      if (computed !== undefined) data.nextActionDate = computed;
    }
  }

  const brand = await prisma.brand.update({
    where: { id: params.id },
    data,
  });

  if (logType) {
    await prisma.contactHistoryEntry.create({
      data: { brandId: brand.id, date: now, type: logType, channel: body.channel ?? null, content: body.content ?? null },
    });
  }

  if (body.pipelineStatus === "DEVIS_ACCEPTE") {
    await ensureClientAndProjects(brand.id, brand.discoveryNotes, brand.potentialRevenue);
  }

  // « Devis accepté » annulé : projets créés automatiquement et encore vierges masqués,
  // ainsi que le client s'il n'a plus rien (réaffichés si le devis est de nouveau accepté).
  if (leavesAccepted(previousStatus, body.pipelineStatus)) {
    const result = await cancelBrandAcceptance(brand.id);
    return NextResponse.json({ ...brand, projectsHidden: result.hidden, projectsKept: result.kept });
  }

  return NextResponse.json(brand);
}
