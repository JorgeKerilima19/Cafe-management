// app/(admin)/inventory/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ✅ Simple actions that redirect on success
export async function createInventoryItem(formData: FormData) {
  const name = formData.get("name") as string;
  const quantity = parseFloat(formData.get("quantity") as string);
  const unit = formData.get("unit") as string;
  const category = formData.get("category") as string;
  const threshold = parseFloat(formData.get("threshold") as string) || 0;
  const notes = formData.get("notes") as string;

  if (!name?.trim() || isNaN(quantity) || !unit?.trim()) {
    throw new Error("Nombre, cantidad y unidad son requeridos");
  }

  await prisma.inventoryItem.create({
    data: {
      name: name.trim(),
      quantity,
      unit: unit.trim(),
      category: category?.trim() || null,
      threshold,
      notes: notes?.trim() || null,
    },
  });

  revalidatePath("/inventory");
  redirect("/inventory?success=created");
}

export async function deleteInventoryItem(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) throw new Error("ID requerido");

  await prisma.inventoryItem.delete({ where: { id } });
  revalidatePath("/inventory");
  redirect("/inventory?success=deleted");
}

export async function updateInventoryItem(formData: FormData) {
  const id = formData.get("id") as string;
  const quantity = parseFloat(formData.get("quantity") as string);

  if (!id || isNaN(quantity)) {
    throw new Error("Datos inválidos");
  }

  await prisma.inventoryItem.update({
    where: { id },
    data: { quantity },
  });
  revalidatePath("/inventory");
  redirect("/inventory?success=updated");
}

export async function getInventoryItems() {
  return await prisma.inventoryItem.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      quantity: true,
      unit: true,
      category: true,
      threshold: true,
      notes: true,
      updatedAt: true,
    },
  });
}
