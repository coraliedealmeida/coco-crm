import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { label } = (await req.json()) as { label?: string };
  if (!label || !label.trim()) {
    return NextResponse.json({ error: "Libellé requis" }, { status: 400 });
  }

  const task = await prisma.dashboardTask.create({ data: { label: label.trim() } });
  return NextResponse.json(task);
}
