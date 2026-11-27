import { NextResponse } from "next/server";
import { prisma, prismaRaw } from "@/lib/prisma";
import { requireSession } from "@/lib/apiAuth";

// Fusionne 2 lignes ProspectImport (doublon LinkedIn/Instagram détecté manuellement) :
// keepId est conservé (fusion des infos), removeId part à la corbeille.
export async function POST(req: Request) {
  const denied = await requireSession();
  if (denied) return denied;

  const { keepId, removeId } = (await req.json()) as { keepId?: string; removeId?: string };

  if (!keepId || !removeId || keepId === removeId) {
    return NextResponse.json({ error: "Deux lignes distinctes sont requises" }, { status: 400 });
  }

  const [keep, remove] = await Promise.all([
    prisma.prospectImport.findUnique({ where: { id: keepId } }),
    prisma.prospectImport.findUnique({ where: { id: removeId } }),
  ]);

  if (!keep || !remove) {
    return NextResponse.json({ error: "Ligne introuvable" }, { status: 404 });
  }

  const platform = keep.platform === remove.platform ? keep.platform : "BOTH";
  const keepContacts = (keep.contacts ?? []) as unknown[];
  const removeContacts = (remove.contacts ?? []) as unknown[];

  const merged = await prisma.prospectImport.update({
    where: { id: keepId },
    data: {
      platform,
      handle: keep.handle ?? remove.handle,
      profileUrl: keep.profileUrl ?? remove.profileUrl,
      contacts: [...keepContacts, ...removeContacts] as object,
      brandCategory: keep.brandCategory ?? remove.brandCategory,
    },
  });

  // Le doublon fusionné part à la corbeille (masqué, jamais effacé).
  await prismaRaw.prospectImport.update({ where: { id: removeId }, data: { deletedAt: new Date() } });

  return NextResponse.json(merged);
}
