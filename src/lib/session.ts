import { SignJWT, jwtVerify } from "jose";

const encoder = new TextEncoder();

export const SESSION_COOKIE = "app_hockey_session";
export const SESSION_MAX_AGE_SECONDS = Number(process.env.SESSION_MAX_AGE_SECONDS ?? 60 * 60 * 12);

type SessionPayload = {
  sub: string;
  role: "participant" | "coach" | "admin";
  username: string;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET manquant");
  }
  return encoder.encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const result = await jwtVerify(token, getSecret());
    return result.payload as SessionPayload;
  } catch {
    return null;
  }
}
