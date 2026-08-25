"use server";

import { prisma } from "@/lib/prisma";
import { saveBase64Image } from "@/utils/saveImage";
import { revalidatePath } from "next/cache";
import { unlink } from "fs/promises";
import { join } from "path";

// ===== CREATE =====
export async function createMenuItem(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData,
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
    console.warn("Could not delete old image:", error);
  }
}

// ===== UPDATE =====
export async function updateMenuItem(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData,
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
    const currentItem = await prisma.menuItem.findUnique({ where: { id } });
    if (!currentItem) {
      return { error: "Item no encontrado" };
    }

    let imageUrl = currentItem.imageUrl;
    if (imageBase64) {
      await deleteOldImage(currentItem.imageUrl);
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

// ==========================================
// RECIPE ACTIONS (NEW)
// ==========================================

/**
 * Replaces the entire recipe for a menu item.
 * Expects formData with "menuItemId" and "ingredients" as JSON string.
 * ingredients = [{ inventoryItemId: string, quantityRequired: number }, ...]
 */
export async function saveRecipe(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData,
) {
  const menuItemId = formData.get("menuItemId") as string;
  const ingredientsJson = formData.get("ingredients") as string;

  if (!menuItemId) {
    return { error: "ID del item requerido" };
  }

  let ingredients: Array<{
    inventoryItemId: string;
    quantityRequired: number;
  }> = [];

  try {
    if (ingredientsJson && ingredientsJson.trim() !== "[]") {
      ingredients = JSON.parse(ingredientsJson);
    }
  } catch {
    return { error: "Formato de ingredientes inválido" };
  }

  // Validate each ingredient
  for (const ing of ingredients) {
    if (
      !ing.inventoryItemId ||
      isNaN(ing.quantityRequired) ||
      ing.quantityRequired <= 0
    ) {
      return {
        error:
          "Cada ingrediente requiere un item de inventario y cantidad válida",
      };
    }
  }

  try {
    // Use a transaction: delete old recipe (cascade deletes ingredients), then create new one
    await prisma.$transaction(async (tx) => {
      // Delete existing recipe if any
      await tx.recipe.deleteMany({ where: { menuItemId } });

      // Only create a new recipe if there are ingredients
      if (ingredients.length > 0) {
        await tx.recipe.create({
          data: {
            menuItemId,
            ingredients: {
              create: ingredients.map((ing) => ({
                inventoryItemId: ing.inventoryItemId,
                quantityRequired: ing.quantityRequired,
              })),
            },
          },
        });
      }
    });

    revalidatePath(`/settings/menu/${menuItemId}`);
    revalidatePath("/settings/menu");
    return { success: true };
  } catch (error) {
    console.error("Save recipe error:", error);
    return { error: "Error al guardar la receta" };
  }
}

/**
 * Fetches all inventory items (for the recipe dropdown)
 */
export async function getInventoryItemsForRecipe() {
  return await prisma.inventoryItem.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      unit: true,
      quantity: true,
    },
  });
}
