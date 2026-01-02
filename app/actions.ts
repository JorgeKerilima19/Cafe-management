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
  redirect("admin/dashboard");
}
export async function logout() {
  "use server";
  await destroySession();
  redirect("/login");
}

export async function createOrder(formData: FormData) {
  "use server";

  const items = JSON.parse(formData.get("items") as string);
  const total = parseFloat(formData.get("total") as string);
  const customerName = formData.get("customerName") as string | null;
  const customerPhone = formData.get("customerPhone") as string | null;
  const paymentMethod = "PENDING"; // Will be set in payment page

  // For now, just redirect to payment with order data
  // In real app, you'd save to DB here
  // But for MVP, we'll pass via URL or context (we'll use URL searchParams)

  // Encode order data in URL (base64 to keep it safe)
  const orderData = { items, total, customerName, customerPhone };
  const encoded = btoa(JSON.stringify(orderData));

  redirect(`/payment?order=${encoded}`);
}
