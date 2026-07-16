import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { uploadPrivateFile } from "@/lib/storage";

const schema = z.object({
  participantId: z.string().optional(),
  categoryId: z.string().cuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  audience: z.enum(["participant", "coach"]),
  isVisibleToParticipant: z.enum(["true", "false"]).optional(),
  assignMode: z.enum(["broadcast", "oneToOne"]).optional(),
});

const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(80),
});

const updateCategorySchema = z.object({
  categoryId: z.string().cuid(),
  name: z.string().trim().min(2).max(80),
});

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const url = new URL(request.url);
  const resource = url.searchParams.get("resource");

  if (resource !== "categories") {
    return NextResponse.json({ error: "Ressource inconnue." }, { status: 400 });
  }

  const categories = await db.documentCategory.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          documents: true,
        },
      },
    },
  });

  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const url = new URL(request.url);
  const resource = url.searchParams.get("resource");

  if (resource === "categories") {
    const body = await request.json().catch(() => null);
    const parsed = createCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Nom de catégorie invalide." }, { status: 400 });
    }

    const name = parsed.data.name;

    const existing = await db.documentCategory.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ error: "Cette catégorie existe déjà." }, { status: 409 });
    }

    const category = await db.documentCategory.create({
      data: { name },
      select: { id: true, name: true },
    });

    return NextResponse.json({ category }, { status: 201 });
  }

  const formData = await request.formData();
  const result = schema.safeParse({
    participantId: String(formData.get("participantId") ?? "").trim() || undefined,
    categoryId: String(formData.get("categoryId") ?? "").trim() || undefined,
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    audience: String(formData.get("audience") ?? "participant").trim(),
    isVisibleToParticipant: String(formData.get("isVisibleToParticipant") ?? "true").trim(),
    assignMode: String(formData.get("assignMode") ?? "broadcast").trim(),
  });
  const participantIdsRaw = String(formData.get("participantIds") ?? "").trim();
  const filesFromList = formData.getAll("files").filter((value): value is File => value instanceof File);
  const singleFile = formData.get("file");
  const files = filesFromList.length
    ? filesFromList
    : singleFile instanceof File
      ? [singleFile]
      : [];

  if (!result.success || !files.length) {
    return NextResponse.json({ error: "Données de formulaire invalides." }, { status: 400 });
  }

  const { participantId, categoryId, title, description, audience, assignMode } = result.data;
  const isVisibleToParticipant = result.data.isVisibleToParticipant !== "false";
  let participantIds: string[] = [];

  if (participantIdsRaw) {
    let participantIdsPayload: unknown;

    try {
      participantIdsPayload = JSON.parse(participantIdsRaw);
    } catch {
      return NextResponse.json({ error: "Liste de participants invalide." }, { status: 400 });
    }

    const parsedIds = z.array(z.string().min(1)).safeParse(participantIdsPayload);

    if (!parsedIds.success) {
      return NextResponse.json({ error: "Liste de participants invalide." }, { status: 400 });
    }

    participantIds = Array.from(new Set(parsedIds.data));
  }

  const targetParticipantIds =
    audience === "coach" ? [] : participantIds.length ? participantIds : participantId ? [participantId] : [];

  if (audience === "participant" && !targetParticipantIds.length) {
    return NextResponse.json({ error: "Participant requis pour un document participant." }, { status: 400 });
  }

  if (audience === "participant" && assignMode === "oneToOne" && files.length !== targetParticipantIds.length) {
    return NextResponse.json(
      { error: "Pour l'attribution 1 document par athlète, le nombre de fichiers doit correspondre au nombre d'athlètes." },
      { status: 400 },
    );
  }

  if (targetParticipantIds.length) {
    const existingParticipants = await db.user.findMany({
      where: { id: { in: targetParticipantIds }, role: "participant" },
      select: { id: true },
    });

    if (existingParticipants.length !== targetParticipantIds.length) {
      return NextResponse.json({ error: "Un ou plusieurs participants sont introuvables." }, { status: 404 });
    }
  }

  if (categoryId) {
    const category = await db.documentCategory.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      return NextResponse.json({ error: "Catégorie introuvable." }, { status: 404 });
    }
  }

  const targets = audience === "coach" ? [null] : targetParticipantIds;
  const created: Array<{
    id: string;
    title: string;
    fileName: string;
    updatedAt: Date;
    participantId: string | null;
    audience: "participant" | "coach";
    category: { id: string; name: string } | null;
    isVisibleToParticipant: boolean;
  }> = [];

  const createDocumentWithFile = async (targetParticipantId: string | null, file: File) => {
    const buffer = new Uint8Array(await file.arrayBuffer());
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageFolder = audience === "coach" ? "coach" : targetParticipantId;
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

    const createdDocument = await db.document.create({
      data: {
        title,
        description: description || null,
        fileName: file.name,
        storageKey,
        participantId: targetParticipantId,
        audience,
        categoryId: categoryId ?? null,
        isVisibleToParticipant: audience === "participant" ? isVisibleToParticipant : false,
      },
      select: {
        id: true,
        title: true,
        fileName: true,
        updatedAt: true,
        participantId: true,
        audience: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        isVisibleToParticipant: true,
      },
    });

    created.push(createdDocument);
    return null;
  };

  if (audience === "participant" && assignMode === "oneToOne") {
    for (const [index, targetParticipantId] of targets.entries()) {
      const earlyResponse = await createDocumentWithFile(targetParticipantId, files[index]);

      if (earlyResponse) {
        return earlyResponse;
      }
    }
  } else {
    for (const file of files) {
      for (const targetParticipantId of targets) {
        const earlyResponse = await createDocumentWithFile(targetParticipantId, file);

        if (earlyResponse) {
          return earlyResponse;
        }
      }
    }
  }

  return NextResponse.json({
    document: created[0],
    documents: created,
    createdCount: created.length,
  }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const url = new URL(request.url);
  const resource = url.searchParams.get("resource");
  const categoryId = url.searchParams.get("categoryId")?.trim();

  if (resource !== "categories") {
    return NextResponse.json({ error: "Ressource inconnue." }, { status: 400 });
  }

  if (!categoryId) {
    return NextResponse.json({ error: "categoryId requis." }, { status: 400 });
  }

  const existing = await db.documentCategory.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Catégorie introuvable." }, { status: 404 });
  }

  await db.documentCategory.delete({ where: { id: categoryId } });

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const url = new URL(request.url);
  const resource = url.searchParams.get("resource");

  if (resource !== "categories") {
    return NextResponse.json({ error: "Ressource inconnue." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateCategorySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Payload catégorie invalide." }, { status: 400 });
  }

  const { categoryId, name } = parsed.data;

  const existing = await db.documentCategory.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Catégorie introuvable." }, { status: 404 });
  }

  const conflict = await db.documentCategory.findFirst({
    where: {
      id: { not: categoryId },
      name: { equals: name, mode: "insensitive" },
    },
    select: { id: true },
  });

  if (conflict) {
    return NextResponse.json({ error: "Cette catégorie existe déjà." }, { status: 409 });
  }

  const category = await db.documentCategory.update({
    where: { id: categoryId },
    data: { name },
    select: { id: true, name: true },
  });

  return NextResponse.json({ category });
}
