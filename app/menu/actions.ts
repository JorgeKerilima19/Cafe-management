// app/menu/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { generateEscPosReceipt, printReceiptToPOS } from "@/lib/printer";
import { redirect } from "next/navigation";

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

  await prisma.order.create({
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
  });

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
