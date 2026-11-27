import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { buildBackup } from "@/lib/backup";
import { isCronAuthorized } from "@/lib/cronAuth";

/**
 * Sauvegarde quotidienne : exporte TOUTES les tables (liste dans `lib/backup.ts`)
 * en JSON et l'envoie par email en pièce jointe. Restauration : voir
 * `docs/restauration-sauvegarde.md`.
 */
export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const backup = await buildBackup(prisma);
  const json = JSON.stringify(backup, null, 2);
  const dateLabel = new Date().toISOString().slice(0, 10);
  const c = backup.counts;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: "Dashboard COCO <onboarding@resend.dev>",
    to: process.env.NOTIFICATION_EMAIL ?? "",
    subject: `Sauvegarde Dashboard COCO — ${dateLabel}`,
    html:
      `<p>Voici la sauvegarde quotidienne automatique de toutes les données de ton CRM ` +
      `(${c.brands} marques, ${c.prospectImports} prospects importés, ${c.clients} clients, ` +
      `${c.projects} projets, ${c.invoices} factures, ${c.dashboardTasks} tâches).</p>` +
      `<p>Garde ce fichier de côté — il permet de tout reconstituer en cas de problème d'accès à la base de données.</p>`,
    attachments: [
      {
        filename: `sauvegarde-coco-${dateLabel}.json`,
        content: Buffer.from(json).toString("base64"),
      },
    ],
  });

  if (error) {
    console.error("Sauvegarde : échec de l'envoi de l'email", error);
    return NextResponse.json({ sent: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sent: true, counts: c, sizeKb: Math.round(json.length / 1024) });
}
