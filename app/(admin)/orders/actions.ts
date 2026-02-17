// app/(admin)/order/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { toZonedTime } from "date-fns-tz";
import { revalidatePath } from "next/cache";

const TIMEZONE = "America/Lima";

function getStartOfDayInLima() {
  const now = new Date();
  const limaNow = toZonedTime(now, TIMEZONE);

  // Create date at midnight Lima time
  const year = limaNow.getFullYear();
  const month = limaNow.getMonth();
  const day = limaNow.getDate();

  const startOfDayLima = new Date(Date.UTC(year, month, day, 5, 0, 0, 0)); // UTC-5 for Lima

  return startOfDayLima;
}

export async function getTodaysOrders() {
  const start = getStartOfDayInLima();

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
      user: {
        select: {
          name: true,
        },
      },
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
  revalidatePath("/orders");
}

export async function voidOrder(formData: FormData) {
  const orderId = formData.get("orderId") as string;
  const reason = formData.get("reason") as string;
  if (!orderId || !reason?.trim()) {
    return { error: "Razón requerida" };
  }
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Pedido no encontrado");

  // Use Lima timezone for voidedAt
  const voidedAt = toZonedTime(new Date(), TIMEZONE);

  await prisma.voidRecord.create({
    data: {
      orderId,
      amount: order.total,
      reason: reason.trim(),
      voidedAt,
      voidedById: order.userId || null,
    },
  });
  await prisma.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED" },
  });
  revalidatePath("/orders");
  return { success: true };
}
