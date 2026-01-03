// app/(admin)/settings/reports/actions.ts
"use server";

import { prisma } from "@/lib/prisma";

async function getReportTotal(startDate: Date, endDate: Date) {
  const result = await prisma.order.aggregate({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      status: "COMPLETED",
    },
    _sum: {
      total: true,
      cashAmount: true,
      yapeAmount: true,
    },
  });

  return {
    total: result._sum.total || 0,
    cash: result._sum.cashAmount || 0,
    yape: result._sum.yapeAmount || 0,
  };
}

// Daily report (UTC-aligned)
export async function getDailyReport(dateStr: string) {
  const { start, end } = getDateRangeInUTC(dateStr);
  return await getReportTotal(start, end);
}

// Weekly report (Monday start, UTC-aligned)
export async function getWeeklyReport(year: number, week: number) {
  // Calculate Monday of week in UTC
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const daysToMonday = (8 - (jan1.getUTCDay() || 7)) % 7;
  const firstMonday = new Date(jan1);
  firstMonday.setUTCDate(jan1.getUTCDate() + daysToMonday);

  const targetMonday = new Date(firstMonday);
  targetMonday.setUTCDate(firstMonday.getUTCDate() + (week - 1) * 7);

  const start = new Date(targetMonday);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(targetMonday);
  end.setUTCDate(targetMonday.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);

  const data = await getReportTotal(start, end);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
    data,
  };
}

// Monthly report (UTC-aligned)
export async function getMonthlyReport(year: number, month: number) {
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
  const data = await getReportTotal(start, end);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
    data,
  };
}
export async function getOrdersForPeriod(
  type: "daily" | "weekly" | "monthly",
  ...args: string[]
) {
  const { start, end } = getDateRangeFromParams(type, ...args);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: start, lte: end } },
    select: {
      id: true,
      customerName: true,
      total: true,
      paymentMethod: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // ✅ Convert Date to string
  return orders.map((order) => ({
    ...order,
    createdAt: order.createdAt.toISOString(), // ← Now it's a string
  }));
}
export async function getVoidRecordsCount(
  type: "daily" | "weekly" | "monthly",
  ...args: (string | number)[]
) {
  const { start, end } = getDateRangeFromParams(type, ...args);

  return await prisma.voidRecord.count({
    where: { voidedAt: { gte: start, lte: end } },
  });
}

// Helper to get date range based on period type
// Helper: Parse "YYYY-MM-DD" as UTC day
function getDateRangeInUTC(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
  return { start, end };
}

// Helper to get date range based on period type
function getDateRangeFromParams(
  type: "daily" | "weekly" | "monthly",
  ...args: (string | number)[]
): { start: Date; end: Date } {
  // ✅ Explicit return type
  if (type === "daily") {
    return getDateRangeInUTC(args[0] as string);
  } else if (type === "weekly") {
    const year = parseInt(args[0] as string);
    const week = parseInt(args[1] as string);

    // Calculate Monday of week in UTC
    const jan1 = new Date(Date.UTC(year, 0, 1));
    const daysToMonday = (8 - (jan1.getUTCDay() || 7)) % 7;
    const firstMonday = new Date(jan1);
    firstMonday.setUTCDate(jan1.getUTCDate() + daysToMonday);

    const targetMonday = new Date(firstMonday);
    targetMonday.setUTCDate(firstMonday.getUTCDate() + (week - 1) * 7);

    const start = new Date(targetMonday);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(targetMonday);
    end.setUTCDate(targetMonday.getUTCDate() + 6);
    end.setUTCHours(23, 59, 59, 999);

    return { start, end };
  } else {
    const year = parseInt(args[0] as string);
    const month = parseInt(args[1] as string);

    const start = new Date(Date.UTC(year, month, 1));
    const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
    return { start, end };
  }
}
