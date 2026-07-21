import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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
