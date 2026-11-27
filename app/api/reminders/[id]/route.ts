import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/apiAuth";

export async function PATCH(request: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  const denied = await requireSession();
  if (denied) return denied;

  const body = await request.json();
  const data: Record<string, unknown> = {};

  if ("date" in body) data.date = new Date(body.date);
  if ("label" in body) data.label = body.label;
  if ("completed" in body) data.completed = body.completed;

  const reminder = await prisma.reminder.update({ where: { id: params.id }, data });
  return NextResponse.json(reminder);
}

export async function DELETE(_request: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  const denied = await requireSession();
  if (denied) return denied;

  await prisma.reminder.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
