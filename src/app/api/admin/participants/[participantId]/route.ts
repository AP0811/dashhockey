import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";

const schema = z
  .object({
    fullName: z.string().min(2).optional(),
    username: z.string().min(3).optional(),
    password: z.string().min(4).optional(),
  })
  .refine((value) => Boolean(value.fullName || value.username || value.password), {
    message: "Au moins un champ doit être fourni.",
  });

type Params = {
  params: Promise<{ participantId: string }>;
};

export async function PATCH(request: Request, context: Params) {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { participantId } = await context.params;
  const existing = await db.user.findFirst({
    where: { id: participantId, role: "participant" },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Participant introuvable." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const result = schema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
  }

  const payload = result.data;
  const data: {
    fullName?: string;
    username?: string;
    email?: string;
    passwordHash?: string;
  } = {};

  if (payload.fullName) {
    data.fullName = payload.fullName.trim();
  }

  if (payload.username) {
    const username = payload.username.trim().toLowerCase();
    const generatedEmail = `${username}@participants.local`;

    const conflict = await db.user.findFirst({
      where: {
        id: { not: participantId },
        OR: [{ username }, { email: generatedEmail }],
      },
      select: { id: true },
    });

    if (conflict) {
      return NextResponse.json({ error: "Username ou email déjà utilisé." }, { status: 409 });
    }

    data.username = username;
    data.email = generatedEmail;
  }

  if (payload.password) {
    data.passwordHash = await hashPassword(payload.password);
  }

  const updated = await db.user.update({
    where: { id: participantId },
    data,
    select: {
      id: true,
      fullName: true,
      username: true,
      participantCode: true,
      groupName: true,
    },
  });

  return NextResponse.json({ participant: updated });
}
