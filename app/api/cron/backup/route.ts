import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

/**
 * Sauvegarde mensuelle : exporte toutes les données en JSON et l'envoie par
 * email en pièce jointe. Sert de filet de sécurité si l'accès à la base de
 * données (Neon) venait à être perdu.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const [brands, contactHistory, reminders, sectors, sources, settings] = await Promise.all([
    prisma.brand.findMany(),
    prisma.contactHistoryEntry.findMany(),
    prisma.reminder.findMany(),
    prisma.sectorOption.findMany(),
    prisma.sourceOption.findMany(),
    prisma.settings.findMany(),
  ]);

  const backup = {
    exportedAt: new Date().toISOString(),
    brands,
    contactHistory,
    reminders,
    sectors,
    sources,
    settings,
  };

  const json = JSON.stringify(backup, null, 2);
  const dateLabel = new Date().toISOString().slice(0, 10);

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "Dashboard COCO <onboarding@resend.dev>",
    to: process.env.NOTIFICATION_EMAIL ?? "",
    subject: `Sauvegarde Dashboard COCO — ${dateLabel}`,
    html: `<p>Voici la sauvegarde mensuelle automatique de toutes les données de ton CRM (${brands.length} marques, ${contactHistory.length} entrées de suivi, ${reminders.length} rappels).</p><p>Garde ce fichier de côté — il permet de tout reconstituer en cas de problème d'accès à la base de données.</p>`,
    attachments: [
      {
        filename: `sauvegarde-coco-${dateLabel}.json`,
        content: Buffer.from(json).toString("base64"),
      },
    ],
  });

  return NextResponse.json({ sent: true, brandsCount: brands.length });
}
