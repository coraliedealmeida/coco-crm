import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as { completed?: boolean; dueDate?: string | null };

  const data: Record<string, unknown> = {};
  if ("completed" in body) data.completed = body.completed;
  if ("dueDate" in body) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;

  const task = await prisma.dashboardTask.update({ where: { id }, data });
  return NextResponse.json(task);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.dashboardTask.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
