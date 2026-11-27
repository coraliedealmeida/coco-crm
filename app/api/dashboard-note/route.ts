import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/apiAuth";

export async function PATCH(req: Request) {
  const denied = await requireSession();
  if (denied) return denied;

  const { content } = (await req.json()) as { content: string };

  const note = await prisma.dashboardNote.upsert({
    where: { id: "singleton" },
    update: { content },
    create: { id: "singleton", content },
  });
  return NextResponse.json(note);
}
