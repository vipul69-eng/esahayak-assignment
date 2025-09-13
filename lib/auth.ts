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
  role: "USER" | "ADMIN"; // NEW: role for RBAC
};

export async function createSessionCookie(
  payload: SessionPayload,
  maxAgeSec = 60 * 60 * 24 * 7,
) {
  // include role in the token payload
  const token = await new SignJWT({
    username: payload.username,
    role: payload.role,
  })
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
    const sub = String(payload.sub);
    const username =
      typeof payload.username === "string" ? payload.username : "";
    // Default to USER if missing role in legacy cookies
    const roleValue = typeof payload.role === "string" ? payload.role : "USER";
    const role = roleValue === "ADMIN" ? "ADMIN" : "USER";

    return { sub, username, role };
  } catch {
    return null;
  }
}
