import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Tâche quotidienne : crée la fiche Brand des prospects dont la date programmée est arrivée.
// Avant ce moment, ces marques n'existent que dans ProspectImport (invisibles du Pipeline/Dashboard).
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const now = new Date();
  const due = await prisma.prospectImport.findMany({
    where: { status: "OUI", integratedAt: null, scheduledDate: { lte: now } },
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
