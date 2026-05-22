import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@/types/domain";
import { db } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token);
  if (!payload) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      username: true,
      email: true,
      fullName: true,
      role: true,
      groupName: true,
      participantCode: true,
    },
  });

  return user;
}

export async function requireRole(role: Role) {
  const user = await getCurrentUser();

  if (!user || user.role !== role) {
    redirect("/");
  }

  return user;
}
