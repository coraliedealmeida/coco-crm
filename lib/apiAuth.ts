import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/lib/auth";

/**
 * Deuxième contrôle de connexion, dans chaque route API (le premier est dans
 * `middleware.ts`). Si une faille permettait un jour de contourner le middleware,
 * les données resteraient protégées.
 * Usage en tête de route : `const denied = await requireSession(); if (denied) return denied;`
 */
export async function requireSession(): Promise<NextResponse | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (await verifySessionToken(token)) return null;
  return NextResponse.json({ error: "Session expirée : reconnecte-toi." }, { status: 401 });
}
