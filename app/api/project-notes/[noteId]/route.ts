import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, { params }: { params: { noteId: string } }) {
  const body = await request.json();
  const data: Record<string, unknown> = {};
  if ("content" in body) data.content = body.content;
  if ("date" in body) data.date = new Date(body.date);

  const note = await prisma.projectNote.update({ where: { id: params.noteId }, data });
  return NextResponse.json(note);
}

export async function DELETE(_request: NextRequest, { params }: { params: { noteId: string } }) {
  await prisma.projectNote.delete({ where: { id: params.noteId } });
  return NextResponse.json({ ok: true });
}
