import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Fusionne 2 lignes ProspectImport (doublon LinkedIn/Instagram détecté manuellement) :
// keepId est conservé (fusion des infos), removeId est supprimé.
export async function POST(req: Request) {
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

  await prisma.prospectImport.delete({ where: { id: removeId } });

  return NextResponse.json(merged);
}
