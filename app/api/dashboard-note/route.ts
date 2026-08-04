import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const { content } = (await req.json()) as { content: string };

  const note = await prisma.dashboardNote.upsert({
    where: { id: "singleton" },
    update: { content },
    create: { id: "singleton", content },
  });
  return NextResponse.json(note);
}
