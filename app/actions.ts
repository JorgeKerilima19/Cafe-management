// app/actions.ts
"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/utils/bcrypt";
import { createSession, destroySession } from "@/utils/session";

export async function registerStaff(
  prevState: { error: string } | null,
  formData: FormData
) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as "ADMIN" | "BARISTA" | "STAFF";

  if (!name || !email || !password) {
    return { error: "Todos los campos son requeridos" };
  }
  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Este correo ya está registrado" };
  }

  try {
    const hashedPassword = await hashPassword(password);
    await prisma.user.create({
      data: { name, email, password: hashedPassword, role },
    });
  } catch (error) {
    console.error("Database error during registration:", error);
    return { error: "Error al crear la cuenta. Intente nuevamente." };
  }

  redirect("/login");
}

export async function login(
  prevState: { error: string } | null,
  formData: FormData
) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Correo y contraseña son requeridos" };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "Credenciales incorrectas" };
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return { error: "Credenciales incorrectas" };
  }

  await createSession(user.id);
  redirect("/");
}
export async function logout() {
  "use server";
  await destroySession();
  redirect("/login");
}
