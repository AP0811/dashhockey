import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { deletePrivateFile, uploadPrivateFile } from "@/lib/storage";

const schema = z.object({
  participantId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
});

type Params = {
  params: Promise<{ documentId: string }>;
};

export async function PATCH(request: Request, context: Params) {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { documentId } = await context.params;
  const document = await db.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      storageKey: true,
      fileName: true,
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Document introuvable." }, { status: 404 });
  }

  const formData = await request.formData();
  const result = schema.safeParse({
    participantId: String(formData.get("participantId") ?? "").trim(),
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
  });

  if (!result.success) {
    return NextResponse.json({ error: "Données de formulaire invalides." }, { status: 400 });
  }

  const payload = result.data;
  const participant = await db.user.findFirst({
    where: { id: payload.participantId, role: "participant" },
    select: { id: true },
  });

  if (!participant) {
    return NextResponse.json({ error: "Participant introuvable." }, { status: 404 });
  }

  const file = formData.get("file");
  let fileName = document.fileName;

  if (file instanceof File) {
    fileName = file.name;
    await uploadPrivateFile({
      key: document.storageKey,
      body: new Uint8Array(await file.arrayBuffer()),
      contentType: file.type || "application/pdf",
    });
  }

  const updated = await db.document.update({
    where: { id: documentId },
    data: {
      title: payload.title,
      description: payload.description || null,
      participantId: participant.id,
      fileName,
    },
    select: {
      id: true,
      title: true,
      fileName: true,
      updatedAt: true,
      participantId: true,
    },
  });

  return NextResponse.json({ document: updated });
}

export async function DELETE(_: Request, context: Params) {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { documentId } = await context.params;
  const document = await db.document.findUnique({
    where: { id: documentId },
    select: { id: true, storageKey: true },
  });

  if (!document) {
    return NextResponse.json({ error: "Document introuvable." }, { status: 404 });
  }

  await deletePrivateFile(document.storageKey);
  await db.document.delete({ where: { id: documentId } });

  return NextResponse.json({ ok: true });
}
