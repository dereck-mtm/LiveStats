import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

export type SessionData = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  displayName: string;
  imageUrl?: string;
};

const COOKIE_NAME = "livestats_session";

function getSecret() {
  return process.env.AUTH_SECRET || "dev-insecure-auth-secret-change-me";
}

function sign(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function encode(data: SessionData) {
  const payload = Buffer.from(JSON.stringify(data), "utf8").toString(
    "base64url",
  );
  return `${payload}.${sign(payload)}`;
}

function decode(value: string): SessionData | null {
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionData | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return decode(raw);
}

export async function setSession(data: SessionData) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, encode(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}
