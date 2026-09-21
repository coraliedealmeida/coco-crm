import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { engagementOverdueDays, PAUSE_ACTIVATION_OVERDUE_DAYS } from "@/lib/pipeline";

// Tâche quotidienne : crée la fiche Brand des prospects dont la date programmée est arrivée.
// Avant ce moment, ces marques n'existent que dans ProspectImport (invisibles du Pipeline/Dashboard).
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const now = new Date();

  // Tant que la routine d'engagement accuse un retard important, on n'alimente pas le pipeline :
  // les prospects programmés restent en attente (leur date glisse) et reprendront ensuite.
  const [routineBrands, settings] = await Promise.all([
    prisma.brand.findMany({
      where: { pipelineStatus: "ROUTINE_ENGAGEMENT", archivedAt: null },
      select: { lastEngagementAt: true, engagementStartDate: true },
    }),
    prisma.settings.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } }),
  ]);
  const maxOverdue = Math.max(
    0,
    ...routineBrands.map((b) => engagementOverdueDays(b, now, settings.daysBetweenEngagements))
  );
  if (maxOverdue >= PAUSE_ACTIVATION_OVERDUE_DAYS) {
    return NextResponse.json({ activated: 0, paused: true, maxOverdue });
  }

  // Une seule marque par passage, même si plusieurs sont dues (reprise après une pause) :
  // évite qu'elles arrivent toutes d'un coup.
  const due = await prisma.prospectImport.findMany({
    where: { status: "OUI", integratedAt: null, scheduledDate: { lte: now } },
    orderBy: { scheduledDate: "asc" },
    take: 1,
  });

  const activated: string[] = [];

  for (const p of due) {
    const contacts = (p.contacts ?? []) as { name: string; position: string; profileUrl: string; platform?: string }[];
    const primaryContact = contacts[0] ?? null;
    const namedContacts = contacts.filter((c) => c.name?.trim());

    const brand = await prisma.brand.create({
      data: {
        name: p.enrichedName ?? p.rawName,
        platform: p.platform === "INSTAGRAM" ? "INSTAGRAM" : p.platform === "BOTH" ? "BOTH" : "LINKEDIN",
        acquisitionPath: "ROUTINE",
        sector: "Animalier",
        source: p.platform === "INSTAGRAM" ? "Instagram" : p.platform === "BOTH" ? "LinkedIn + Instagram" : "LinkedIn",
        engagementStartDate: now,
        pipelineStatus: "ROUTINE_ENGAGEMENT",
        contactName: primaryContact?.name ?? null,
        contactRole: primaryContact?.position ?? null,
        discoveryNotes: {
          profileUrl: p.profileUrl ?? null,
          allContacts: contacts,
        },
        prospectImport: { connect: { id: p.id } },
        // Les personnes identifiées à l'import (ex : contacts LinkedIn/Instagram repérés) doivent
        // apparaître directement dans l'encart "Contacts d'intérêt" de la fiche, pas seulement
        // dans discoveryNotes (invisible côté UI, utilisé uniquement en repli pour la rotation).
        contacts:
          namedContacts.length > 0
            ? {
                create: namedContacts.map((c) => ({
                  name: c.name.trim(),
                  role: c.position?.trim() || null,
                  profileUrl: c.profileUrl?.trim() || null,
                  platform: c.platform === "INSTAGRAM" ? "INSTAGRAM" : "LINKEDIN",
                })),
              }
            : undefined,
      },
    });

    await prisma.prospectImport.update({
      where: { id: p.id },
      data: { integratedAt: now, brandId: brand.id },
    });

    activated.push(brand.id);
  }

  return NextResponse.json({ activated: activated.length, brandIds: activated });
}
