import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/apiAuth";

export async function POST(request: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  const denied = await requireSession();
  if (denied) return denied;

  const { date, label } = await request.json();

  if (!date || !label || typeof label !== "string") {
    return NextResponse.json({ error: "Date et libellé requis." }, { status: 400 });
  }

  const reminder = await prisma.reminder.create({
    data: {
      projectId: params.id,
      date: new Date(date),
      label,
    },
  });

  return NextResponse.json(reminder, { status: 201 });
}
