// src/lib/auth.ts
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const SESSION_COOKIE = "sid";
const ALG = "HS256";

function getSecretKey() {
  const secret = process.env.NEXT_AUTH_SECRET;
  if (!secret) throw new Error("Missing AUTH_SECRET");
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  sub: string; // user.id
  username: string;
};

export async function createSessionCookie(
  payload: SessionPayload,
  maxAgeSec = 60 * 60 * 24 * 7,
) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSec}s`)
    .sign(getSecretKey());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSec,
  });
}

export async function clearSessionCookie() {
  (await cookies()).set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const c = await cookies();
  const token = c.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return {
      sub: String(payload.sub),
      username: String(payload.username),
    };
  } catch {
    return null;
  }
}
