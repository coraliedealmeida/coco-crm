import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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
