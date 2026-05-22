import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { uploadPrivateFile } from "@/lib/storage";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const formData = await request.formData();

  const participantId = String(formData.get("participantId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const file = formData.get("file");

  if (!participantId || !title || !(file instanceof File)) {
    return NextResponse.json({ error: "Données de formulaire invalides." }, { status: 400 });
  }

  const participant = await db.user.findFirst({
    where: { id: participantId, role: "participant" },
    select: { id: true },
  });

  if (!participant) {
    return NextResponse.json({ error: "Participant introuvable." }, { status: 404 });
  }

  const buffer = new Uint8Array(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageKey = `documents/${participantId}/${crypto.randomUUID()}-${safeName}`;

  try {
    await uploadPrivateFile({
      key: storageKey,
      body: buffer,
      contentType: file.type || "application/pdf",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const created = await db.document.create({
    data: {
      title,
      description,
      fileName: file.name,
      storageKey,
      participantId,
    },
    select: {
      id: true,
      title: true,
      fileName: true,
      updatedAt: true,
      participantId: true,
    },
  });

  return NextResponse.json({ document: created }, { status: 201 });
}
