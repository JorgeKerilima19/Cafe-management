// app/(admin)/order/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { toZonedTime } from "date-fns-tz";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/utils/session";
import { returnInventoryForOrder } from "@/lib/inventory";

const TIMEZONE = "America/Lima";

function getStartOfDayInLima() {
  const now = new Date();
  const limaNow = toZonedTime(now, TIMEZONE);
  const year = limaNow.getFullYear();
  const month = limaNow.getMonth();
  const day = limaNow.getDate();
  return new Date(Date.UTC(year, month, day, 5, 0, 0, 0));
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
      user: { select: { name: true } },
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

  const user = await getCurrentUser();
  if (!user) {
    return { error: "No autorizado" };
  }

  try {
    // Fetch the order with its items BEFORE voiding
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          select: { menuItemId: true, quantity: true },
        },
      },
    });

    if (!order) return { error: "Pedido no encontrado" };
    if (order.status === "CANCELLED") {
      return { error: "El pedido ya está cancelado" };
    }

    // Wrap void + inventory return in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.voidRecord.create({
        data: {
          orderId,
          amount: order.total,
          reason: reason.trim(),
          voidedAt: new Date(),
          voidedById: user.id,
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });

      // Return inventory based on recipes
      await returnInventoryForOrder(
        order.items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
        })),
      );
    });

    revalidatePath("/orders");
    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    console.error("Void order error:", error);
    return { error: "Error al anular el pedido" };
  }
}
