// app/(admin)/settings/menu/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { saveBase64Image } from "@/utils/saveImage";
import { revalidatePath } from "next/cache";
import { unlink } from "fs/promises";
import { join } from "path";

// ===== CREATE =====
export async function createMenuItem(
  prevState: { error?: string; success?: boolean } | null, // ← ADD THIS
  formData: FormData
) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;
  const price = parseFloat(formData.get("price") as string);
  const category = (formData.get("category") as string) || "General";
  const isActive = formData.has("isActive");
  const imageBase64 = formData.get("imageBase64") as string | null;

  if (!name || isNaN(price)) {
    return { error: "Nombre y precio válidos son requeridos" };
  }

  try {
    let imageUrl: string | null = null;
    if (imageBase64) {
      imageUrl = await saveBase64Image(imageBase64);
    }

    await prisma.menuItem.create({
      data: {
        name,
        description: description || null,
        price,
        category,
        imageUrl,
        isActive,
      },
    });

    revalidatePath("/settings/menu");
    return { success: true };
  } catch (error) {
    console.error("Create menu item error:", error);
    return { error: "Error al crear el item" };
  }
}

async function deleteOldImage(imageUrl: string | null) {
  if (!imageUrl || !imageUrl.startsWith("/uploads/")) return;

  try {
    const filename = imageUrl.split("/").pop();
    if (filename) {
      const filepath = join(process.cwd(), "public", imageUrl);
      await unlink(filepath);
    }
  } catch (error) {
    // Ignore if file doesn't exist
    console.warn("Could not delete old image:", error);
  }
}

// ===== UPDATE =====
export async function updateMenuItem(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;
  const price = parseFloat(formData.get("price") as string);
  const category = (formData.get("category") as string) || "General";
  const isActive = formData.has("isActive");
  const imageBase64 = formData.get("imageBase64") as string | null;

  if (!id || !name || isNaN(price)) {
    return { error: "ID, nombre y precio válidos son requeridos" };
  }

  try {
    // Fetch current item to get old image
    const currentItem = await prisma.menuItem.findUnique({ where: { id } });
    if (!currentItem) {
      return { error: "Item no encontrado" };
    }

    let imageUrl = currentItem.imageUrl; // keep old if no new

    if (imageBase64) {
      // Delete old image
      await deleteOldImage(currentItem.imageUrl);
      // Save new
      imageUrl = await saveBase64Image(imageBase64);
    }

    await prisma.menuItem.update({
      where: { id },
      data: {
        name,
        description: description || null,
        price,
        category,
        imageUrl,
        isActive,
      },
    });

    revalidatePath(`/settings/menu/${id}`);
    revalidatePath("/settings/menu");
    return { success: true };
  } catch (error) {
    console.error("Update menu item error:", error);
    return { error: "Error al actualizar el item" };
  }
}

// ===== DELETE =====
export async function deleteMenuItem(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;

  try {
    await prisma.menuItem.delete({ where: { id } });
    revalidatePath("/settings/menu");
  } catch (error) {
    console.error("Delete menu item error:", error);
  }
}
