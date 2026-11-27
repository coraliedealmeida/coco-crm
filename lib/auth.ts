const COOKIE_NAME = "coco_session";
const TOKEN_VERSION = "v2";
/** Durée de validité d'une connexion, vérifiée côté serveur (pas seulement par le navigateur). */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET manquant");
  return secret;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(value: string, secret = getSecret()): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return toHex(signature);
}

/** Comparaison en temps constant (fonctionne aussi dans le middleware, sans module Node). */
export function constantTimeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/**
 * Jeton = « v2.<date de connexion en secondes>.<signature> ».
 * Chaque connexion a son propre jeton, qui expire au bout de 30 jours.
 * Pour déconnecter tous les appareils d'un coup : changer `SESSION_SECRET` dans Vercel.
 */
export async function createSessionToken(nowMs = Date.now()): Promise<string> {
  const payload = `${TOKEN_VERSION}.${Math.floor(nowMs / 1000)}`;
  return `${payload}.${await hmac(payload)}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
  nowMs = Date.now()
): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== TOKEN_VERSION) return false;
  const issuedAt = Number(parts[1]);
  if (!Number.isInteger(issuedAt)) return false;
  const nowSec = Math.floor(nowMs / 1000);
  if (issuedAt > nowSec + 300 || nowSec - issuedAt > SESSION_MAX_AGE_SECONDS) return false;
  const expected = await hmac(`${parts[0]}.${parts[1]}`);
  return constantTimeEqual(parts[2], expected);
}

/** Vérifie le mot de passe sans révéler, par le temps de réponse, à quel caractère il diffère. */
export async function checkPassword(password: string): Promise<boolean> {
  const expected = process.env.APP_PASSWORD;
  if (!expected) throw new Error("APP_PASSWORD manquant");
  const [a, b] = await Promise.all([hmac(password), hmac(expected)]);
  return constantTimeEqual(a, b);
}

export { COOKIE_NAME };
