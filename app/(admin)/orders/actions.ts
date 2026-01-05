// app/(admin)/order/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { startOfDay } from "date-fns";
import { revalidatePath } from "next/cache";

export async function getTodaysOrders() {
  const start = startOfDay(new Date());
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: start },
      status: { not: "CANCELLED" },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      customerName: true,
      total: true,
      status: true,
      createdAt: true,
      paymentMethod: true,
      cashAmount: true,
      yapeAmount: true,
      // ✅ Include user (even if null)
      user: {
        select: {
          name: true,
        },
      },
      // ✅ Include items
      items: {
        select: {
          name: true,
          quantity: true,
          price: true,
        },
      },
    },
  });
  return orders;
}
export async function completeOrder(formData: FormData) {
  const orderId = formData.get("orderId") as string;
  if (!orderId) throw new Error("ID requerido");
  await prisma.order.update({
    where: { id: orderId },
    data: { status: "COMPLETED" },
  });
  revalidatePath("/order");
}

export async function voidOrder(formData: FormData) {
  const orderId = formData.get("orderId") as string;
  const reason = formData.get("reason") as string;
  if (!orderId || !reason?.trim()) {
    return { error: "Razón requerida" };
  }
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Pedido no encontrado");
  await prisma.voidRecord.create({
    data: {
      orderId,
      amount: order.total,
      reason: reason.trim(),
      voidedAt: new Date(),
      voidedById: order.userId || null,
    },
  });
  await prisma.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED" },
  });
  revalidatePath("/order");
  return { success: true };
}
