import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
  return NextResponse.json(settings);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const data: Record<string, unknown> = {};
  for (const key of [
    "daysBeforeGreenLight",
    "daysBeforeRelance1",
    "daysBeforeRelance2",
    "emailNotifications",
    "showMonthlyStats",
  ]) {
    if (key in body) data[key] = body[key];
  }

  const settings = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });

  return NextResponse.json(settings);
}
