// app/(admin)/settings/reports/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { toZonedTime } from "date-fns-tz";
import { formatInTimeZone } from "date-fns-tz";
import { startOfWeek, addDays } from "date-fns";

const TIMEZONE = "America/Lima";

function getDateRangeInLima(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);

  const limaStart = new Date(year, month - 1, day, 0, 0, 0, 0);
  const zonedStart = toZonedTime(limaStart, TIMEZONE);
  const start = new Date(zonedStart.toISOString());

  const limaEnd = new Date(year, month - 1, day, 23, 59, 59, 999);
  const zonedEnd = toZonedTime(limaEnd, TIMEZONE);
  const end = new Date(zonedEnd.toISOString());

  return { start, end };
}

function getWeeklyRange(year: number, week: number) {
  // Get first day of the year
  const jan4 = new Date(Date.UTC(year, 0, 4)); // Jan 4 is always in week 1

  // Calculate first Monday of the year (ISO week)
  const firstWeekStart = startOfWeek(jan4, { weekStartsOn: 1 });

  // Calculate target Monday
  const targetMonday = addDays(firstWeekStart, (week - 1) * 7);

  // Convert to Lima timezone for proper boundaries
  const limaStart = toZonedTime(targetMonday, TIMEZONE);
  const limaEnd = addDays(limaStart, 6);
  limaEnd.setHours(23, 59, 59, 999);

  // Convert to UTC for database queries
  const zonedStart = toZonedTime(limaStart, TIMEZONE);
  const zonedEnd = toZonedTime(limaEnd, TIMEZONE);

  const start = new Date(zonedStart.toISOString());
  const end = new Date(zonedEnd.toISOString());

  return { start, end };
}

function getMonthlyRange(year: number, month: number) {
  // month is 0-indexed (0 = January, 11 = December)

  // Start of month: 1st day at 00:00:00 Lima time
  const limaStart = new Date(year, month, 1, 0, 0, 0, 0);
  const zonedStart = toZonedTime(limaStart, TIMEZONE);
  const start = new Date(zonedStart.toISOString());

  // End of month: last day at 23:59:59.999 Lima time
  // (month + 1, day 0) = last day of current month
  const limaEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
  const zonedEnd = toZonedTime(limaEnd, TIMEZONE);
  const end = new Date(zonedEnd.toISOString());

  return { start, end };
}

// ── Sales Aggregation ──────────────────────────────────────────────────

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

// ── Expense Aggregation ────────────────────────────────────────────────

async function getExpenseTotal(startDate: Date, endDate: Date) {
  const result = await prisma.dayExpense.aggregate({
    where: { createdAt: { gte: startDate, lte: endDate } },
    _sum: { cost: true },
  });
  return result._sum.cost || 0;
}

// ── Public Report APIs ─────────────────────────────────────────────────

export async function getDailyReport(dateStr: string) {
  const { start, end } = getDateRangeInLima(dateStr);
  const [sales, expenses] = await Promise.all([
    getReportTotal(start, end),
    getExpenseTotal(start, end),
  ]);
  return { ...sales, expenses };
}

export async function getWeeklyReport(year: number, week: number) {
  const { start, end } = getWeeklyRange(year, week);
  const [sales, expenses] = await Promise.all([
    getReportTotal(start, end),
    getExpenseTotal(start, end),
  ]);
  return {
    start: formatInTimeZone(start, TIMEZONE, "yyyy-MM-dd"),
    end: formatInTimeZone(end, TIMEZONE, "yyyy-MM-dd"),
    data: { ...sales, expenses },
  };
}

export async function getMonthlyReport(year: number, month: number) {
  const { start, end } = getMonthlyRange(year, month);
  const [sales, expenses] = await Promise.all([
    getReportTotal(start, end),
    getExpenseTotal(start, end),
  ]);
  return {
    start: formatInTimeZone(start, TIMEZONE, "yyyy-MM-dd"),
    end: formatInTimeZone(end, TIMEZONE, "yyyy-MM-dd"),
    data: { ...sales, expenses },
  };
}

// ── Orders & Voids ─────────────────────────────────────────────────────

export async function getOrdersForPeriod(
  periodType: "daily" | "weekly" | "monthly",
  ...args: (string | number)[]
) {
  let start: Date, end: Date;

  if (periodType === "daily") {
    ({ start, end } = getDateRangeInLima(args[0] as string));
  } else if (periodType === "weekly") {
    ({ start, end } = getWeeklyRange(args[0] as number, args[1] as number));
  } else {
    ({ start, end } = getMonthlyRange(args[0] as number, args[1] as number));
  }

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

  return orders.map((order) => ({
    ...order,
    createdAt: formatInTimeZone(
      order.createdAt,
      TIMEZONE,
      "yyyy-MM-dd'T'HH:mm:ss",
    ),
  }));
}

export async function getVoidRecordsCount(
  periodType: "daily" | "weekly" | "monthly",
  ...args: (string | number)[]
) {
  let start: Date, end: Date;

  if (periodType === "daily") {
    ({ start, end } = getDateRangeInLima(args[0] as string));
  } else if (periodType === "weekly") {
    ({ start, end } = getWeeklyRange(args[0] as number, args[1] as number));
  } else {
    ({ start, end } = getMonthlyRange(args[0] as number, args[1] as number));
  }

  return prisma.voidRecord.count({
    where: { voidedAt: { gte: start, lte: end } },
  });
}

export async function getExpensesForPeriod(
  periodType: "daily" | "weekly" | "monthly",
  ...args: (string | number)[]
) {
  let start: Date, end: Date;

  if (periodType === "daily") {
    ({ start, end } = getDateRangeInLima(args[0] as string));
  } else if (periodType === "weekly") {
    ({ start, end } = getWeeklyRange(args[0] as number, args[1] as number));
  } else {
    ({ start, end } = getMonthlyRange(args[0] as number, args[1] as number));
  }

  const expenses = await prisma.dayExpense.findMany({
    where: { createdAt: { gte: start, lte: end } },
    orderBy: { createdAt: "desc" },
  });

  return expenses.map((expense) => ({
    id: expense.id,
    name: expense.name,
    cost: expense.cost,
    notes: expense.notes,
    createdAt: formatInTimeZone(
      expense.createdAt,
      TIMEZONE,
      "yyyy-MM-dd'T'HH:mm:ss",
    ),
  }));
}
