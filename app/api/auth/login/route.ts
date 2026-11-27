import { NextRequest, NextResponse } from "next/server";
import { checkPassword, createSessionToken, COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth";
import { recordFailure, resetFailures, retryAfterSeconds } from "@/lib/loginRateLimit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "inconnue";

  const wait = retryAfterSeconds(ip);
  if (wait > 0) {
    const minutes = Math.ceil(wait / 60);
    return NextResponse.json(
      { error: `Trop d'essais. Réessaie dans ${minutes} minute${minutes > 1 ? "s" : ""}.` },
      { status: 429, headers: { "Retry-After": String(wait) } }
    );
  }

  const body = await request.json().catch(() => ({}));
  const password = (body as { password?: unknown }).password;

  if (typeof password !== "string" || !(await checkPassword(password))) {
    recordFailure(ip);
    // Petit délai : rend les essais en rafale beaucoup plus lents.
    await new Promise((resolve) => setTimeout(resolve, 800));
    return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
  }

  resetFailures(ip);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
