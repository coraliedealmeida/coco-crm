import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/apiAuth";

export async function POST(req: Request) {
  const denied = await requireSession();
  if (denied) return denied;

  const { label, dueDate } = (await req.json()) as { label?: string; dueDate?: string | null };
  if (!label || !label.trim()) {
    return NextResponse.json({ error: "Libellé requis" }, { status: 400 });
  }

  const task = await prisma.dashboardTask.create({
    data: { label: label.trim(), dueDate: dueDate ? new Date(dueDate) : null },
  });
  return NextResponse.json(task);
}
