import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { createSignedFileUrl } from "@/lib/storage";

const querySchema = z.object({
  disposition: z.enum(["inline", "attachment"]).default("inline"),
});

type Params = {
  params: Promise<{ documentId: string }>;
};

export async function GET(request: Request, context: Params) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { documentId } = await context.params;
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    disposition: url.searchParams.get("disposition") ?? "inline",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const document = await db.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      fileName: true,
      storageKey: true,
      participantId: true,
      audience: true,
      participant: {
        select: {
          id: true,
          groupName: true,
        },
      },
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Document introuvable." }, { status: 404 });
  }

  const canAccess =
    user.role === "admin" ||
    (user.role === "participant" && document.audience === "participant" && user.id === document.participantId) ||
    (user.role === "coach" && (document.audience === "coach" || (user.groupName && document.participant && user.groupName === document.participant.groupName)));

  if (!canAccess) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const signedUrl = await createSignedFileUrl({
      key: document.storageKey,
      fileName: document.fileName,
      disposition: parsed.data.disposition,
    });

    if (parsed.data.disposition === "attachment") {
      return NextResponse.redirect(signedUrl);
    }

    const upstream = await fetch(signedUrl);

    if (!upstream.ok) {
      return NextResponse.json({ error: "Impossible de charger le document." }, { status: upstream.status });
    }

    const headers = new Headers(upstream.headers);
    headers.set("content-type", "application/pdf");
    headers.set("content-disposition", `inline; filename="${document.fileName}"`);
    headers.set("x-content-type-options", "nosniff");

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible de créer le lien signé.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
