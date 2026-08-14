import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as { name?: string; role?: string | null; profileUrl?: string | null; platform?: string };

  const data: Record<string, unknown> = {};
  if ("name" in body && body.name) data.name = body.name.trim();
  if ("role" in body) data.role = body.role?.trim() || null;
  if ("profileUrl" in body) data.profileUrl = body.profileUrl?.trim() || null;
  if ("platform" in body) data.platform = body.platform === "INSTAGRAM" ? "INSTAGRAM" : "LINKEDIN";

  const contact = await prisma.brandContact.update({ where: { id }, data });
  return NextResponse.json(contact);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.brandContact.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
