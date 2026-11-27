import { beforeEach, describe, expect, it } from "vitest";
import {
  checkPassword,
  constantTimeEqual,
  createSessionToken,
  SESSION_MAX_AGE_SECONDS,
  verifySessionToken,
} from "@/lib/auth";
import { MAX_FAILURES, recordFailure, resetFailures, retryAfterSeconds, WINDOW_MS } from "@/lib/loginRateLimit";

beforeEach(() => {
  process.env.SESSION_SECRET = "secret-de-test-tres-long";
  process.env.APP_PASSWORD = "bon-mot-de-passe";
});

describe("jeton de session", () => {
  it("accepte un jeton frais", async () => {
    expect(await verifySessionToken(await createSessionToken())).toBe(true);
  });

  it("refuse un jeton de plus de 30 jours", async () => {
    const now = Date.now();
    const token = await createSessionToken(now);
    expect(await verifySessionToken(token, now + (SESSION_MAX_AGE_SECONDS - 60) * 1000)).toBe(true);
    expect(await verifySessionToken(token, now + (SESSION_MAX_AGE_SECONDS + 60) * 1000)).toBe(false);
  });

  it("refuse un jeton modifié, l'ancien format et un autre secret", async () => {
    const token = await createSessionToken();
    const [v, t, sig] = token.split(".");
    expect(await verifySessionToken(`${v}.${Number(t) + 1000}.${sig}`)).toBe(false);
    expect(await verifySessionToken("ok.abcdef")).toBe(false);
    expect(await verifySessionToken(undefined)).toBe(false);
    process.env.SESSION_SECRET = "un-autre-secret";
    expect(await verifySessionToken(token)).toBe(false);
  });
});

describe("mot de passe", () => {
  it("vérifie le mot de passe", async () => {
    expect(await checkPassword("bon-mot-de-passe")).toBe(true);
    expect(await checkPassword("bon-mot-de-pass")).toBe(false);
    expect(await checkPassword("")).toBe(false);
  });

  it("compare des textes", () => {
    expect(constantTimeEqual("abc", "abc")).toBe(true);
    expect(constantTimeEqual("abc", "abd")).toBe(false);
    expect(constantTimeEqual("abc", "abcd")).toBe(false);
  });
});

describe("limite d'essais", () => {
  it(`bloque après ${MAX_FAILURES} échecs puis débloque après 15 minutes`, () => {
    const ip = "1.2.3.4";
    resetFailures(ip);
    const t0 = 1_000_000;
    for (let i = 0; i < MAX_FAILURES - 1; i++) recordFailure(ip, t0 + i);
    expect(retryAfterSeconds(ip, t0 + 10)).toBe(0);
    recordFailure(ip, t0 + 10);
    expect(retryAfterSeconds(ip, t0 + 20)).toBeGreaterThan(0);
    expect(retryAfterSeconds(ip, t0 + WINDOW_MS + 20)).toBe(0);
  });

  it("une connexion réussie remet le compteur à zéro", () => {
    const ip = "5.6.7.8";
    for (let i = 0; i < MAX_FAILURES; i++) recordFailure(ip);
    expect(retryAfterSeconds(ip)).toBeGreaterThan(0);
    resetFailures(ip);
    expect(retryAfterSeconds(ip)).toBe(0);
  });
});
