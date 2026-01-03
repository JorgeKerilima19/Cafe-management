// app/(admin)/settings/void-records/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/utils/session";

// Helper: Parse "YYYY-MM-DD" as UTC day
function getDateRangeInUTC(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
  return { start, end };
}

export async function voidOrder(formData: FormData) {
  const orderId = formData.get("orderId") as string;
  const reason = formData.get("reason") as string;
  // Optional: voidedAt is typically now(), so we ignore input for consistency
  if (!orderId || !reason?.trim()) {
    return { error: "ID de pedido y razón son requeridos" };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { error: "No autorizado" };
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { error: "Pedido no encontrado" };
    }

    if (order.status === "CANCELLED") {
      return { error: "El pedido ya está cancelado" };
    }

    await prisma.voidRecord.create({
      data: {
        orderId,
        amount: order.total,
        reason: reason.trim(),
        voidedAt: new Date(), // Always use current time
        voidedById: user.id,
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });

    return { success: true };
  } catch (error) {
    console.error("Void order error:", error);
    return { error: "Error al anular el pedido" };
  }
}

// Fetch void records for a UTC date
export async function getVoidRecords(date: string) {
  const { start, end } = getDateRangeInUTC(date);

  const voids = await prisma.voidRecord.findMany({
    where: {
      voidedAt: { gte: start, lte: end },
    },
    include: {
      voidedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalAmount = voids.reduce((sum, v) => sum + v.amount, 0);
  return { voids, totalAmount };
}
