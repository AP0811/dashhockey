import { Buffer } from "node:buffer";
import JSZip from "jszip";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { createSignedFileUrl } from "@/lib/storage";

const bodySchema = z.object({
  documentIds: z.array(z.string().min(1)).min(1).max(200),
  groupName: z.string().trim().min(1).max(120).optional(),
});

function sanitizeForFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function canAccessDocument(user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>, document: {
  participantId: string | null;
  audience: "participant" | "coach";
  isVisibleToParticipant: boolean;
  participant: { groupName: string | null } | null;
}) {
  if (user.role === "admin") {
    return true;
  }

  if (
    user.role === "participant" &&
    document.audience === "participant" &&
    document.isVisibleToParticipant &&
    user.id === document.participantId
  ) {
    return true;
  }

  if (user.role === "coach") {
    if (document.audience === "coach") {
      return true;
    }

    return Boolean(user.groupName && document.participant && user.groupName === document.participant.groupName);
  }

  return false;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const documents = await db.document.findMany({
    where: {
      id: { in: parsed.data.documentIds },
    },
    select: {
      id: true,
      title: true,
      fileName: true,
      storageKey: true,
      participantId: true,
      audience: true,
      isVisibleToParticipant: true,
      participant: {
        select: {
          fullName: true,
          groupName: true,
        },
      },
    },
  });

  const allowedDocuments = documents.filter((document) => canAccessDocument(user, document));

  if (!allowedDocuments.length) {
    return NextResponse.json({ error: "Aucun document accessible à télécharger." }, { status: 403 });
  }

  const zip = new JSZip();

  for (const document of allowedDocuments) {
    try {
      const signedUrl = await createSignedFileUrl({
        key: document.storageKey,
        fileName: document.fileName,
        disposition: "attachment",
      });

      const upstream = await fetch(signedUrl);

      if (!upstream.ok) {
        continue;
      }

      const bytes = await upstream.arrayBuffer();
      const safeAthlete = sanitizeForFileName(document.participant?.fullName ?? "coach");
      const safeFileName = sanitizeForFileName(document.fileName || `${document.title}.pdf`);
      zip.file(`${safeAthlete}/${safeFileName}`, bytes);
    } catch {
      // Ignore failed files and continue with remaining ones.
    }
  }

  const entries = Object.keys(zip.files);

  if (!entries.length) {
    return NextResponse.json({ error: "Impossible de préparer l'archive ZIP." }, { status: 500 });
  }

  const archive = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
  const archiveBuffer = Buffer.from(archive);
  const suffix = new Date().toISOString().slice(0, 10);
  const baseName = sanitizeForFileName(parsed.data.groupName ?? "documents-groupe").toLowerCase();
  const fileName = `${baseName || "documents-groupe"}-${suffix}.zip`;

  return new Response(archiveBuffer, {
    status: 200,
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${fileName}"`,
      "cache-control": "no-store",
    },
  });
}
