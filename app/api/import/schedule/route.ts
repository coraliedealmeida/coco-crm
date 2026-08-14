import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scheduleProspects } from "@/lib/prospectScheduling";

// Réglage simple : espacement (en jours ouvrés) entre deux nouvelles marques activées,
// pour ne jamais faire arriver plusieurs nouvelles marques le même jour en routine
// d'engagement (l'objectif est ~10 min max par jour). (Deviendra un champ Settings si
// besoin de le rendre réglable depuis l'interface.)
const SPACING_DAYS = 2;

// Aucune marque ne doit démarrer avant cette date (reprise après l'été, pas d'intérêt à s'y
// mettre trop tôt). Si programmé avant cette date, tout se cale automatiquement dessus.
const MIN_START_DATE = new Date("2026-08-10T00:00:00.000Z");

// Ne crée AUCUNE fiche Brand ici : assigne uniquement une date de lancement (scheduledDate)
// aux prospects validés ("Oui") pas encore programmés. La fiche Brand n'est créée que le jour J,
// par le cron d'activation (app/api/cron/activate-prospects/route.ts).
export async function POST() {
  const toSchedule = await prisma.prospectImport.findMany({
    where: { status: "OUI", scheduledDate: null, integratedAt: null },
    orderBy: { importedAt: "asc" },
    select: { id: true, brandCategory: true },
  });

  if (toSchedule.length === 0) {
    return NextResponse.json({ scheduled: 0, message: "Aucun prospect validé à programmer." });
  }

  const lastScheduled = await prisma.prospectImport.findFirst({
    where: { scheduledDate: { not: null } },
    orderBy: { scheduledDate: "desc" },
    select: { scheduledDate: true },
  });

  const lastScheduledDate = lastScheduled?.scheduledDate ?? null;

  const plan = scheduleProspects(toSchedule, {
    lastScheduledDate,
    spacingDays: SPACING_DAYS,
    minStartDate: MIN_START_DATE,
  });

  for (const [id, date] of plan) {
    await prisma.prospectImport.update({ where: { id }, data: { scheduledDate: date } });
  }

  return NextResponse.json({ scheduled: plan.size });
}
