import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/apiAuth";

const VALID_STATUSES = ["PENDING", "OUI", "NON", "PLUS_TARD"];
const VALID_CATEGORIES = ["GRANDE_MARQUE", "PME_STARTUP", "INDEPENDANT"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireSession();
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json();
  const { status, brandCategory } = body as { status?: string; brandCategory?: string | null };

  const data: { status?: string; brandCategory?: string | null } = {};

  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }
    data.status = status;
  }

  if (brandCategory !== undefined) {
    if (brandCategory !== null && !VALID_CATEGORIES.includes(brandCategory)) {
      return NextResponse.json({ error: "Catégorie invalide" }, { status: 400 });
    }
    data.brandCategory = brandCategory;
  }

  const updated = await prisma.prospectImport.update({ where: { id }, data });

  return NextResponse.json(updated);
}
