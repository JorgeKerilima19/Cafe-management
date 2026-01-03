// app/menu/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function createOrder(formData: FormData) {
  const itemsStr = formData.get("items");
  const totalStr = formData.get("total");
  const customerName = formData.get("customerName") as string;
  const paymentMethod = formData.get("paymentMethod") as string;
  const cashAmount = formData.get("cashAmount") as string;
  const yapeAmount = formData.get("yapeAmount") as string;

  if (!itemsStr || !totalStr || !customerName?.trim() || !paymentMethod) {
    throw new Error("Datos incompletos");
  }

  let items, total, cash, yape;
  try {
    items = JSON.parse(itemsStr as string);
    total = parseFloat(totalStr as string);
    cash = parseFloat(cashAmount) || 0;
    yape = parseFloat(yapeAmount) || 0;
  } catch {
    throw new Error("Datos inválidos");
  }

  if (total <= 0 || items.length === 0) {
    throw new Error("Pedido vacío");
  }

  // Validate menu items exist
  const menuItemIds = items.map((item: any) => item.id);
  const existingItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds } },
    select: { id: true },
  });

  if (existingItems.length !== menuItemIds.length) {
    throw new Error("Item no disponible");
  }

  //  CREATE ORDER
  await prisma.order.create({
    data: {
      customerName: customerName.trim(),
      customerPhone: null,
      total,
      cashAmount: cash,
      yapeAmount: yape,
      paymentMethod,
      status: "PENDING",
      items: {
        create: items.map((item: any) => ({
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      },
    },
  });

  // REDIRECT — NO TRY/CATCH!
  redirect("/menu/thank-you");
}
