import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { statusLabel } from "@/lib/pipeline";
import { projectLabel } from "@/lib/projects";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const settings = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  if (!settings.emailNotifications) {
    return NextResponse.json({ skipped: true, reason: "Notifications désactivées." });
  }

  const now = new Date();
  const [brands, quoteRequests, reminders] = await Promise.all([
    prisma.brand.findMany({
      where: {
        archivedAt: null,
        pipelineStatus: { in: ["PREMIER_DM", "RELANCE_1", "DEVIS_ENVOYE", "RELANCE_DEVIS_1"] },
        nextActionDate: { lte: now },
      },
    }),
    // Demandes de devis pour des clients déjà existants : mêmes relances qu'une marque classique.
    prisma.quoteRequest.findMany({
      where: {
        status: { in: ["DEVIS_ENVOYE", "RELANCE_DEVIS_1"] },
        nextActionDate: { lte: now },
      },
      include: { client: { include: { brand: true } } },
    }),
    // Rappels programmés (marque ou projet) arrivés à échéance — jusqu'ici absents de cet email.
    prisma.reminder.findMany({
      where: {
        completed: false,
        date: { lte: now },
        OR: [
          { brandId: { not: null }, brand: { archivedAt: null } },
          { projectId: { not: null }, project: { currentStep: { not: "Terminé" } } },
        ],
      },
      include: { brand: true, project: { include: { client: { include: { brand: true } } } } },
    }),
  ]);

  const total = brands.length + quoteRequests.length + reminders.length;
  if (total === 0) {
    return NextResponse.json({ sent: false, reason: "Aucune relance aujourd'hui." });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const brandItems = brands.map((b) => `<li><strong>${b.name}</strong> — ${statusLabel(b.pipelineStatus)}</li>`);
  const quoteItems = quoteRequests.map(
    (q) =>
      `<li><strong>${q.client.brand.name}</strong> — ${statusLabel(q.status)} (${q.label || "Demande de devis"})</li>`
  );
  const reminderItems = reminders.map((r) => {
    const brandName = r.brand?.name ?? r.project!.client.brand.name;
    const context = r.project ? ` — ${projectLabel(r.project)}` : "";
    return `<li><strong>${brandName}</strong>${context} — 📌 ${r.label}</li>`;
  });
  const list = [...brandItems, ...quoteItems, ...reminderItems].join("");

  await resend.emails.send({
    from: "Dashboard COCO <onboarding@resend.dev>",
    to: process.env.NOTIFICATION_EMAIL ?? "",
    subject: `${total} relance(s) à faire aujourd'hui`,
    html: `<p>Voici les relances à faire aujourd'hui :</p><ul>${list}</ul>`,
  });

  return NextResponse.json({ sent: true, count: total });
}
