import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-server";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  if (user.role === "participant") {
    return NextResponse.json({ participants: [user] });
  }

  if (user.role === "coach") {
    const participants = await db.user.findMany({
      where: {
        role: "participant",
        groupName: user.groupName ?? undefined,
      },
      select: {
        id: true,
        fullName: true,
        groupName: true,
        participantCode: true,
      },
      orderBy: { fullName: "asc" },
    });

    return NextResponse.json({ participants });
  }

  const participants = await db.user.findMany({
    where: { role: "participant" },
    select: {
      id: true,
      fullName: true,
      groupName: true,
      participantCode: true,
    },
    orderBy: { fullName: "asc" },
  });

  return NextResponse.json({ participants });
}
