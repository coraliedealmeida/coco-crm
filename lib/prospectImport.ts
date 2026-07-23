import { prisma } from "@/lib/prisma";

export const DAILY_QUALIFICATION_BATCH_SIZE = 3;

export type QualificationProspect = {
  id: string;
  rawName: string;
  handle: string | null;
  platform: string;
  brandCategory: string | null;
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Lot de marques à qualifier dans la Session du jour : jusqu'à DAILY_QUALIFICATION_BATCH_SIZE
 * marques encore "En attente". Une fois tirée au sort, une marque reste dans le lot (via
 * queuedForSessionAt) tant qu'elle n'a pas été qualifiée (Oui/Non/Maybe) — seules les places
 * libérées par une qualification sont retirées au hasard parmi les marques encore en attente.
 */
export async function getDailyQualificationBatch(): Promise<QualificationProspect[]> {
  const alreadyQueued = await prisma.prospectImport.findMany({
    where: { status: "PENDING", queuedForSessionAt: { not: null } },
    orderBy: { queuedForSessionAt: "asc" },
    take: DAILY_QUALIFICATION_BATCH_SIZE,
    select: { id: true, rawName: true, handle: true, platform: true, brandCategory: true },
  });

  const missing = DAILY_QUALIFICATION_BATCH_SIZE - alreadyQueued.length;
  if (missing <= 0) return alreadyQueued;

  const candidates = await prisma.prospectImport.findMany({
    where: { status: "PENDING", queuedForSessionAt: null },
    select: { id: true, rawName: true, handle: true, platform: true, brandCategory: true },
  });

  const picked = shuffle(candidates).slice(0, missing);
  if (picked.length > 0) {
    const now = new Date();
    await prisma.prospectImport.updateMany({
      where: { id: { in: picked.map((p) => p.id) } },
      data: { queuedForSessionAt: now },
    });
  }

  return [...alreadyQueued, ...picked];
}
