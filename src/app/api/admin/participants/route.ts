import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";

const schema = z.object({
  fullName: z.string().min(2),
  username: z.string().min(3),
  password: z.string().min(4),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const result = schema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
  }

  const payload = result.data;
  const username = payload.username.trim().toLowerCase();
  const generatedEmail = `${username}@participants.local`;

  const existingUser = await db.user.findFirst({
    where: {
      OR: [{ username }, { email: generatedEmail }],
    },
    select: { id: true },
  });

  if (existingUser) {
    return NextResponse.json({ error: "Username ou email déjà utilisé." }, { status: 409 });
  }

  const passwordHash = await hashPassword(payload.password);

  const created = await db.user.create({
    data: {
      role: "participant",
      fullName: payload.fullName.trim(),
      username,
      email: generatedEmail,
      passwordHash,
      groupName: "Groupe A",
      participantCode: null,
    },
    select: {
      id: true,
      fullName: true,
      username: true,
      participantCode: true,
      groupName: true,
    },
  });

  return NextResponse.json({ participant: created }, { status: 201 });
}
