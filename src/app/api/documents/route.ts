import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-server";

const schema = z.object({
  participantId: z.string().cuid().optional(),
});

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const url = new URL(request.url);
  const query = schema.safeParse({ participantId: url.searchParams.get("participantId") ?? undefined });

  if (!query.success) {
    return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
  }

  let participantId = query.data.participantId;

  if (user.role === "participant") {
    participantId = user.id;
  }

  if (user.role === "coach") {
    if (!participantId) {
      return NextResponse.json({ documents: [] });
    }

    const participant = await db.user.findUnique({
      where: { id: participantId },
      select: { id: true, groupName: true, role: true },
    });

    if (!participant || participant.role !== "participant" || participant.groupName !== user.groupName) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }
  }

  if (user.role === "admin" && !participantId) {
    return NextResponse.json({ error: "participantId requis pour l'administration." }, { status: 400 });
  }

  const documents = await db.document.findMany({
    where: { participantId },
    select: {
      id: true,
      title: true,
      description: true,
      fileName: true,
      storageKey: true,
      updatedAt: true,
      participantId: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ documents });
}
