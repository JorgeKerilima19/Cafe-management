// app/(admin)/dashboard/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/utils/session";
import { revalidatePath } from "next/cache";
import { startOfDay, endOfDay } from "date-fns";
import { redirect } from "next/navigation";

// Open cash register
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

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

// Close cash register + redirect to summary
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
    include: { openedBy: true },
  });
  if (!register) throw new Error("No hay caja abierta");

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(todayStart);

  const [cashSales, yapeSales, voidRecords] = await Promise.all([
    prisma.order.aggregate({
      where: {
        createdAt: { gte: todayStart, lte: todayEnd },
        status: "COMPLETED",
        paymentMethod: { in: ["CASH", "MIXED"] },
      },
      _sum: { cashAmount: true },
    }),
    prisma.order.aggregate({
      where: {
        createdAt: { gte: todayStart, lte: todayEnd },
        status: "COMPLETED",
        paymentMethod: { in: ["YAPE", "MIXED"] },
      },
      _sum: { yapeAmount: true },
    }),
    prisma.voidRecord.findMany({
      where: { voidedAt: { gte: todayStart, lte: todayEnd } },
      select: { amount: true },
    }),
  ]);

  const totalCash = cashSales._sum.cashAmount || 0;
  const totalYape = yapeSales._sum.yapeAmount || 0;
  const totalSales = totalCash + totalYape;
  const voidLoss = voidRecords.reduce((sum, v) => sum + v.amount, 0);
  const expectedCash = totalCash + register.openingAmount;
  const netBalance = totalSales - register.openingAmount;

  await prisma.cashRegister.update({
    where: { id: register.id },
    data: {
      closingAmount,
      expectedAmount: expectedCash,
      closedAt: new Date(),
      closedById: user.id,
      isOpen: false,
      notes: notes || register.notes,
    },
  });

  revalidatePath("/dashboard");

  // Redirect to summary with encoded data
  redirect(
    `/dashboard/close?data=${encodeURIComponent(
      JSON.stringify({
        openingAmount: register.openingAmount,
        closingAmount,
        totalCash,
        totalYape,
        totalSales,
        voidLoss,
        netBalance,
        expectedCash,
      })
    )}`
  );
}

// Get dashboard data
export async function getDashboardData() {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");

  const todayStart = startOfDay(new Date());
  const [openRegister, todaySales, voidCount] = await Promise.all([
    prisma.cashRegister.findFirst({
      where: { isOpen: true },
      include: { openedBy: { select: { name: true } } },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: todayStart }, status: "COMPLETED" },
      _sum: { total: true, cashAmount: true, yapeAmount: true },
      _count: { id: true },
    }),
    prisma.voidRecord.count({ where: { voidedAt: { gte: todayStart } } }),
  ]);

  const serializedRegister = openRegister
    ? {
        id: openRegister.id,
        openingAmount: openRegister.openingAmount,
        openedAt: openRegister.openedAt.toISOString(),
        openedBy: { name: openRegister.openedBy.name },
      }
    : null;

  return {
    openRegister: serializedRegister,
    todaySales: {
      _sum: {
        total: todaySales._sum.total || 0,
        cashAmount: todaySales._sum.cashAmount || 0,
        yapeAmount: todaySales._sum.yapeAmount || 0,
      },
      _count: { id: todaySales._count.id },
    },
    voidCount,
  };
}
