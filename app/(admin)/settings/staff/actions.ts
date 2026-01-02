// app/(admin)/settings/staff/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/utils/bcrypt";
import { revalidatePath } from "next/cache";

// CREATE STAFF
export async function createStaff(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as "ADMIN" | "BARISTA" | "STAFF";

  if (!name || !email || !password) {
    return { error: "Nombre, correo y contraseña son requeridos" };
  }
  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres" };
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "Este correo ya está registrado" };
    }

    await prisma.user.create({
      data: {
        name,
        email,
        password: await hashPassword(password),
        role,
        isActive: true,
      },
    });

    revalidatePath("/settings/staff");
    return { success: true };
  } catch (error) {
    console.error("Create staff error:", error);
    return { error: "Error al crear la cuenta" };
  }
}

// UPDATE STAFF
export async function updateStaff(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const role = formData.get("role") as "ADMIN" | "BARISTA" | "STAFF";
  const isActive = formData.get("isActive") === "on";
  const masterPassword = formData.get("masterPassword") as string;
  const newPassword = formData.get("newPassword") as string | null;

  if (!id || !name || !email || !masterPassword) {
    return { error: "Todos los campos son requeridos" };
  }

  // Validate master password
  if (masterPassword !== masterPassword) {
    return { error: "Contraseña maestra incorrecta" };
  }

  try {
    const existing = await prisma.user.findFirst({
      where: { email, NOT: { id } },
    });
    if (existing) {
      return { error: "Este correo ya está en uso" };
    }

    const updateData: any = { name, email, role, isActive };

    // Optional: update password
    if (newPassword) {
      if (newPassword.length < 6) {
        return { error: "Nueva contraseña debe tener al menos 6 caracteres" };
      }
      updateData.password = await hashPassword(newPassword);
    }

    await prisma.user.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/settings/staff");
    return { success: true };
  } catch (error) {
    console.error("Update staff error:", error);
    return { error: "Error al actualizar la cuenta" };
  }
}

// DELETE STAFF (requires master password)
export async function deleteStaff(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const id = formData.get("id") as string;
  const masterPassword = formData.get("masterPassword") as string;

  if (!id || !masterPassword) {
    return { error: "ID y contraseña maestra requeridos" };
  }

  if (masterPassword !== masterPassword) {
    return { error: "Contraseña maestra incorrecta" };
  }

  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath("/settings/staff");
    return { success: true };
  } catch (error) {
    console.error("Delete staff error:", error);
    return { error: "Error al eliminar la cuenta" };
  }
}
// DELETE STAFF
export async function handleStaffAction(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const actionType = formData.get("actionType") as
    | "create"
    | "update"
    | "delete";

  if (actionType === "delete") {
    const id = formData.get("id") as string;
    if (!id) return { error: "ID requerido para eliminar" };

    try {
      await prisma.user.delete({ where: { id } });
      revalidatePath("/settings/staff");
      return { success: true };
    } catch (error) {
      console.error("Delete staff error:", error);
      return { error: "Error al eliminar la cuenta" };
    }
  }

  // Handle create/update
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as "ADMIN" | "BARISTA" | "STAFF";
  const isActive = formData.get("isActive") === "on";
  const id = formData.get("id") as string | null;

  if (!name || !email) {
    return { error: "Nombre y correo son requeridos" };
  }

  try {
    if (actionType === "create") {
      if (!password || password.length < 6) {
        return { error: "Contraseña válida requerida" };
      }
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return { error: "Correo ya registrado" };

      await prisma.user.create({
        data: {
          name,
          email,
          password: await hashPassword(password),
          role,
          isActive: true,
        },
      });
    } else if (actionType === "update") {
      if (!id) return { error: "ID requerido para actualizar" };
      const existing = await prisma.user.findFirst({
        where: { email, NOT: { id } },
      });
      if (existing) return { error: "Correo ya en uso" };

      await prisma.user.update({
        where: { id },
        data: { name, email, role, isActive },
      });
    }

    revalidatePath("/settings/staff");
    return { success: true };
  } catch (error) {
    console.error("Staff action error:", error);
    return { error: "Error en la operación" };
  }
}
