import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { completed } = (await req.json()) as { completed: boolean };

  const task = await prisma.dashboardTask.update({ where: { id }, data: { completed } });
  return NextResponse.json(task);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.dashboardTask.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
