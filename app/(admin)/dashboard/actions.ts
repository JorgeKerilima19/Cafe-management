// app/(admin)/dashboard/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/utils/session";
import { revalidatePath } from "next/cache";
import { startOfDay, endOfDay } from "date-fns";
import { redirect } from "next/navigation";

type ActionResult = { success: true } | { error: string };

// Open cash registergetDashboardData
export async function openRegister(formData: FormData) {
  const openingAmount = parseFloat(formData.get("openingAmount") as string);
  const notes = formData.get("notes") as string;

  if (isNaN(openingAmount) || openingAmount < 0) {
    throw new Error("Monto de apertura válido requerido");
  }

  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");

  const existing = await prisma.cashRegister.findFirst({
    where: { isOpen: true },
  });
  if (existing) throw new Error("La caja ya está abierta");

  await prisma.cashRegister.create({
    data: {
      openingAmount,
      notes: notes || null,
      openedById: user.id,
    },
  });

  redirect("/dashboard"); // ✅ Redirect on success
}

// Close cash register
export async function closeRegister(formData: FormData) {
  const closingAmount = parseFloat(formData.get("closingAmount") as string);
  const notes = formData.get("notes") as string;

  if (isNaN(closingAmount) || closingAmount < 0) {
    throw new Error("Monto de cierre válido requerido");
  }

  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");

  const register = await prisma.cashRegister.findFirst({
    where: { isOpen: true },
  });
  if (!register) throw new Error("No hay caja abierta");

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(todayStart);
  const cashSales = await prisma.order.aggregate({
    where: {
      createdAt: { gte: todayStart, lte: todayEnd },
      status: "COMPLETED",
    },
    _sum: { cashAmount: true },
  });

  await prisma.cashRegister.update({
    where: { id: register.id },
    data: {
      closingAmount,
      expectedAmount: (cashSales._sum.cashAmount || 0) + register.openingAmount,
      closedAt: new Date(),
      closedById: user.id,
      isOpen: false,
      notes: notes || register.notes,
    },
  });

  redirect("/dashboard");
}
// Get dashboard data
export async function getDashboardData() {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");

  const [openRegister, todaySales, voidCount] = await Promise.all([
    prisma.cashRegister.findFirst({
      where: { isOpen: true },
      include: { openedBy: { select: { name: true } } },
    }),
    prisma.order.aggregate({
      where: {
        createdAt: { gte: startOfDay(new Date()) },
        status: "COMPLETED",
      },
      _sum: { total: true, cashAmount: true, yapeAmount: true },
      _count: { id: true },
    }),
    prisma.voidRecord.count({
      where: { voidedAt: { gte: startOfDay(new Date()) } },
    }),
  ]);

  // ✅ Serialize openRegister
  const serializedRegister = openRegister
    ? {
        id: openRegister.id,
        openingAmount: openRegister.openingAmount,
        openedAt: openRegister.openedAt.toISOString(),
        openedBy: { name: openRegister.openedBy.name },
      }
    : null;

  // ✅ Handle null sums safely
  const safeSales = {
    _sum: {
      total: todaySales._sum.total || 0,
      cashAmount: todaySales._sum.cashAmount || 0,
      yapeAmount: todaySales._sum.yapeAmount || 0,
    },
    _count: {
      id: todaySales._count.id,
    },
  };

  return {
    openRegister: serializedRegister,
    todaySales: safeSales,
    voidCount,
  };
}
