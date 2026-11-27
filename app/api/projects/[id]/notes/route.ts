import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/apiAuth";

export async function POST(request: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  const denied = await requireSession();
  if (denied) return denied;

  const { date, content } = await request.json();
  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "Contenu requis." }, { status: 400 });
  }
  const note = await prisma.projectNote.create({
    data: {
      projectId: params.id,
      date: date ? new Date(date) : new Date(),
      content,
    },
  });
  return NextResponse.json(note, { status: 201 });
}
