import { prisma } from "@/lib/prisma";

export const DAILY_QUALIFICATION_BATCH_SIZE = 3;

type Contact = { name: string; position: string; profileUrl: string; platform: string };

export type QualificationProspect = {
  id: string;
  rawName: string;
  handle: string | null;
  platform: string;
  brandCategory: string | null;
  profileUrl: string | null;
  contacts: Contact[];
};

const SELECT_FIELDS = {
  id: true,
  rawName: true,
  handle: true,
  platform: true,
  brandCategory: true,
  profileUrl: true,
  contacts: true,
} as const;

function toQualificationProspect(row: {
  id: string;
  rawName: string;
  handle: string | null;
  platform: string;
  brandCategory: string | null;
  profileUrl: string | null;
  contacts: unknown;
}): QualificationProspect {
  return { ...row, contacts: (row.contacts ?? []) as Contact[] };
}

/** Lien le plus utile pour retrouver la marque : sa propre page (LinkedIn/Instagram) si connue,
 * sinon le profil du premier contact identifié, sinon une recherche du site officiel — pour ne
 * jamais laisser le lien vide, même quand rien n'a été récupéré à l'import. */
export function bestProfileLink(p: {
  rawName: string;
  platform: string;
  profileUrl: string | null;
  contacts: Contact[];
}): string {
  if (p.profileUrl) return p.profileUrl;
  if (p.contacts[0]?.profileUrl) return p.contacts[0].profileUrl;
  return `https://www.google.com/search?q=${encodeURIComponent(`${p.rawName} site officiel`)}`;
}

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
    select: SELECT_FIELDS,
  });

  const missing = DAILY_QUALIFICATION_BATCH_SIZE - alreadyQueued.length;
  if (missing <= 0) return alreadyQueued.map(toQualificationProspect);

  const candidates = await prisma.prospectImport.findMany({
    where: { status: "PENDING", queuedForSessionAt: null },
    select: SELECT_FIELDS,
  });

  const picked = shuffle(candidates).slice(0, missing);
  if (picked.length > 0) {
    const now = new Date();
    await prisma.prospectImport.updateMany({
      where: { id: { in: picked.map((p) => p.id) } },
      data: { queuedForSessionAt: now },
    });
  }

  return [...alreadyQueued, ...picked].map(toQualificationProspect);
}
