import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/apiAuth";

export async function PATCH(request: NextRequest, { params: paramsPromise }: { params: Promise<{ noteId: string }> }) {
  const params = await paramsPromise;
  const denied = await requireSession();
  if (denied) return denied;

  const body = await request.json();
  const data: Record<string, unknown> = {};
  if ("content" in body) data.content = body.content;
  if ("date" in body) data.date = new Date(body.date);

  const note = await prisma.projectNote.update({ where: { id: params.noteId }, data });
  return NextResponse.json(note);
}

export async function DELETE(_request: NextRequest, { params: paramsPromise }: { params: Promise<{ noteId: string }> }) {
  const params = await paramsPromise;
  const denied = await requireSession();
  if (denied) return denied;

  await prisma.projectNote.delete({ where: { id: params.noteId } });
  return NextResponse.json({ ok: true });
}
