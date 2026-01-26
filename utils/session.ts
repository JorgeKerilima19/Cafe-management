// utils/session.ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

//  Use ONE consistent cookie name
const SESSION_COOKIE_NAME = "user_id"; // ← Changed from "cafeteria_session"

export async function createSession(userId: string): Promise<void> {
  (await cookies()).set({
    name: SESSION_COOKIE_NAME, //  Now matches
    value: userId,
    httpOnly: true,
    secure: false,
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;

  return await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });
}

export async function requireAuth(
  allowedRoles: ("ADMIN" | "BARISTA" | "STAFF" | "SYSTEM")[] = ["ADMIN"]
) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!allowedRoles.includes(user.role)) {
    throw new Error("No autorizado");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireAuth(["ADMIN"]);
  return user;
}

//  Use the same cookie name here
async function getSessionUserId() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
}
