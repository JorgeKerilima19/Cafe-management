// app/(admin)/dashboard/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/utils/session";
import { revalidatePath } from "next/cache";
import { startOfDay, endOfDay } from "date-fns";
import { redirect } from "next/navigation";

// ── Cash Register: Open ───────────────────────────────────────────────

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

// ── Cash Register: Close ──────────────────────────────────────────────

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

  // Fetch all daily data
  const [cashSales, yapeSales, voidRecords, expenses] = await Promise.all([
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
    prisma.dayExpense.aggregate({
      where: { createdAt: { gte: todayStart, lte: todayEnd } },
      _sum: { cost: true },
    }),
  ]);

  const totalCash = cashSales._sum.cashAmount || 0;
  const totalYape = yapeSales._sum.yapeAmount || 0;
  const totalSales = totalCash + totalYape;
  const voidLoss = voidRecords.reduce((sum, v) => sum + v.amount, 0);
  const totalExpenses = expenses._sum.cost || 0;
  const expectedCash = totalCash + register.openingAmount;
  const netBalance = totalSales - totalExpenses - register.openingAmount;

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

  // Redirect to closing summary with all data
  redirect(
    `/dashboard/close?data=${encodeURIComponent(
      JSON.stringify({
        openingAmount: register.openingAmount,
        closingAmount,
        totalCash,
        totalYape,
        totalSales,
        voidLoss,
        totalExpenses,
        netBalance,
        expectedCash,
      })
    )}`
  );
}

// ── Expenses: Create ───────────────────────────────────────────────────

export async function createDayExpense(formData: FormData) {
  const name = formData.get("name") as string;
  const cost = parseFloat(formData.get("cost") as string);
  const notes = formData.get("notes") as string;

  if (!name?.trim() || isNaN(cost) || cost <= 0) {
    throw new Error("Nombre y costo válido requeridos");
  }

  // ✅ Only allow if register is open
  const openRegister = await prisma.cashRegister.findFirst({
    where: { isOpen: true },
  });
  if (!openRegister) {
    throw new Error("La caja debe estar abierta para registrar gastos");
  }

  await prisma.dayExpense.create({
    data: {
      name: name.trim(),
      cost,
      notes: notes?.trim() || null,
    },
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

// ── Expenses: Fetch Today ──────────────────────────────────────────────

async function getTodayExpenses() {
  const today = new Date();
  const start = startOfDay(today);
  const end = endOfDay(start);

  const [list, totalResult] = await Promise.all([
    prisma.dayExpense.findMany({
      where: { createdAt: { gte: start, lte: end } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.dayExpense.aggregate({
      where: { createdAt: { gte: start, lte: end } },
      _sum: { cost: true },
    }),
  ]);

  return {
    list,
    total: totalResult._sum.cost || 0,
  };
}

// ── Dashboard: Full Data Fetch ─────────────────────────────────────────

export async function getDashboardData() {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");

  const today = new Date();
  const todayStart = startOfDay(today);

  const [openRegister, todaySales, voidCount, rawExpenses] = await Promise.all([
    prisma.cashRegister.findFirst({
      where: { isOpen: true },
      include: { openedBy: { select: { name: true } } },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: todayStart }, status: "COMPLETED" },
      _sum: { total: true, cashAmount: true, yapeAmount: true },
      _count: { id: true },
    }),
    prisma.voidRecord.count({
      where: { voidedAt: { gte: todayStart } },
    }),
    getTodayExpenses(),
  ]);

  // ✅ Serialize openRegister (if exists)
  const serializedRegister = openRegister
    ? {
        id: openRegister.id,
        openingAmount: openRegister.openingAmount,
        openedAt: openRegister.openedAt.toISOString(),
        openedBy: { name: openRegister.openedBy.name },
      }
    : null;

  // ✅ Serialize expenses: convert Date → string for client safety
  const serializedExpenses = {
    total: rawExpenses.total,
    list: rawExpenses.list.map((expense) => ({
      id: expense.id,
      name: expense.name,
      cost: expense.cost,
      notes: expense.notes,
      createdAt: expense.createdAt.toISOString(), // ✅ Fix for TypeScript error
    })),
  };

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
    todayExpenses: serializedExpenses,
  };
}
