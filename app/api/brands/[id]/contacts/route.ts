import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name, role, profileUrl, platform } = (await req.json()) as {
    name?: string;
    role?: string | null;
    profileUrl?: string | null;
    platform?: string;
  };

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }

  const contact = await prisma.brandContact.create({
    data: {
      brandId: id,
      name: name.trim(),
      role: role?.trim() || null,
      profileUrl: profileUrl?.trim() || null,
      platform: platform === "INSTAGRAM" ? "INSTAGRAM" : "LINKEDIN",
    },
  });

  return NextResponse.json(contact);
}
