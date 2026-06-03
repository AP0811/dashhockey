import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { uploadPrivateFile } from "@/lib/storage";

const schema = z.object({
  participantId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  audience: z.enum(["participant", "coach"]),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const formData = await request.formData();
  const result = schema.safeParse({
    participantId: String(formData.get("participantId") ?? "").trim() || undefined,
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    audience: String(formData.get("audience") ?? "participant").trim(),
  });
  const file = formData.get("file");

  if (!result.success || !(file instanceof File)) {
    return NextResponse.json({ error: "Données de formulaire invalides." }, { status: 400 });
  }

  const { participantId, title, description, audience } = result.data;

  if (audience === "participant" && !participantId) {
    return NextResponse.json({ error: "Participant requis pour un document participant." }, { status: 400 });
  }

  if (participantId) {
    const participant = await db.user.findFirst({
      where: { id: participantId, role: "participant" },
      select: { id: true },
    });

    if (!participant) {
      return NextResponse.json({ error: "Participant introuvable." }, { status: 404 });
    }
  }

  const buffer = new Uint8Array(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageFolder = audience === "coach" ? "coach" : participantId;
  const storageKey = `documents/${storageFolder}/${crypto.randomUUID()}-${safeName}`;

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
      description: description || null,
      fileName: file.name,
      storageKey,
      participantId: audience === "coach" ? null : participantId,
      audience,
    },
    select: {
      id: true,
      title: true,
      fileName: true,
      updatedAt: true,
      participantId: true,
      audience: true,
    },
  });

  return NextResponse.json({ document: created }, { status: 201 });
}
