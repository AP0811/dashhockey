import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-server";

const schema = z.object({
  participantId: z.string().cuid().optional(),
  audience: z.enum(["participant", "coach"]).optional(),
});

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const url = new URL(request.url);
  const query = schema.safeParse({
    participantId: url.searchParams.get("participantId") ?? undefined,
    audience: url.searchParams.get("audience") ?? undefined,
  });

  if (!query.success) {
    return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
  }

  let participantId = query.data.participantId;
  let audience = query.data.audience;

  if (user.role === "participant") {
    participantId = user.id;
    audience = "participant";
  }

  if (user.role === "coach") {
    if (!participantId) {
      audience = audience ?? "coach";
    }

    if (participantId) {
      const participant = await db.user.findUnique({
        where: { id: participantId },
        select: { id: true, groupName: true, role: true },
      });

      if (!participant || participant.role !== "participant" || participant.groupName !== user.groupName) {
        return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
      }
    } else if (audience !== "coach") {
      return NextResponse.json({ error: "participantId requis pour les documents participant." }, { status: 400 });
    }
  }

  if (user.role === "admin" && !participantId && audience !== "coach") {
    return NextResponse.json({ error: "participantId requis pour l'administration." }, { status: 400 });
  }

  const documents = await db.document.findMany({
    where:
      audience === "coach"
        ? { audience: "coach" }
        : {
            participantId,
            audience: "participant",
          },
    select: {
      id: true,
      title: true,
      description: true,
      fileName: true,
      storageKey: true,
      updatedAt: true,
      participantId: true,
      audience: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ documents });
}
