import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/session";

const loginSchema = z.object({
  username: z.string().min(2),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parseResult = loginSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
    }

    const { username, password } = parseResult.data;

    const user = await db.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: "Identifiants invalides." }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json({ error: "Identifiants invalides." }, { status: 401 });
    }

    const token = await createSessionToken({
      sub: user.id,
      role: user.role,
      username: user.username,
    });

    const response = NextResponse.json({
      ok: true,
      role: user.role,
    });

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Erreur serveur de connexion." }, { status: 500 });
  }
}
