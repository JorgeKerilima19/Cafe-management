"use server";

import { prisma } from "@/lib/prisma";
import { generateEscPosReceipt, printReceiptToPOS } from "@/lib/printer";
import { redirect } from "next/navigation";
import { deductInventoryForOrder } from "@/lib/inventory";

export async function createOrder(formData: FormData) {
  const itemsStr = formData.get("items");
  const totalStr = formData.get("total");
  const customerName = formData.get("customerName") as string;
  const paymentMethod = formData.get("paymentMethod") as string;
  const cashAmount = formData.get("cashAmount") as string;
  const yapeAmount = formData.get("yapeAmount") as string;

  if (!itemsStr || !totalStr || !customerName) {
    throw new Error("Datos incompletos");
  }

  const items = JSON.parse(itemsStr as string);
  const total = parseFloat(totalStr as string);
  const cash = parseFloat(cashAmount) || 0;
  const yape = parseFloat(yapeAmount) || 0;

  if (!items.length || total <= 0) {
    throw new Error("Pedido inválido");
  }

  // Wrap order creation + inventory deduction in a transaction
  const createdOrder = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        customerName: customerName.trim(),
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
      include: {
        items: {
          select: { menuItemId: true, quantity: true },
        },
      },
    });

    // Deduct inventory based on recipes
    await deductInventoryForOrder(
      order.items.map((i) => ({
        menuItemId: i.menuItemId,
        quantity: i.quantity,
      })),
    );

    return order;
  });

  // Print receipt (outside transaction — non-critical)
  const receipt = generateEscPosReceipt(
    customerName.trim(),
    items,
    total,
    paymentMethod,
    cash,
    yape,
  );
  await printReceiptToPOS(receipt);

  redirect("/menu/thank-you");
}
