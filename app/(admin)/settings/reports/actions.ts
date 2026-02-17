// app/(admin)/settings/reports/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { toZonedTime } from "date-fns-tz";
import { formatInTimeZone } from "date-fns-tz";

const TIMEZONE = "America/Lima";

// ── Helpers: Date Range Calculations (in Lima Time) ───────────────────

function getDateRangeInLima(dateStr: string) {
  // Parse the date string as YYYY-MM-DD in Lima timezone
  const [year, month, day] = dateStr.split("-").map(Number);

  // Create start of day (00:00:00) in Lima timezone
  // Lima is UTC-5, so we create UTC date with 5 hours offset
  const start = new Date(Date.UTC(year, month - 1, day, 5, 0, 0, 0));

  // Create end of day (23:59:59) in Lima timezone
  const end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

  return { start, end };
}

function getWeeklyRange(year: number, week: number) {
  // Get first day of the year
  const jan1 = new Date(Date.UTC(year, 0, 1));

  // Calculate days to first Monday
  const daysToMonday = (8 - (jan1.getUTCDay() || 7)) % 7;
  const firstMonday = new Date(jan1);
  firstMonday.setUTCDate(jan1.getUTCDate() + daysToMonday);

  // Calculate target Monday
  const targetMonday = new Date(firstMonday);
  targetMonday.setUTCDate(firstMonday.getUTCDate() + (week - 1) * 7);

  // Start of week (Monday 00:00:00 Lima time = 05:00:00 UTC)
  const start = new Date(targetMonday);
  start.setUTCHours(5, 0, 0, 0);

  // End of week (Sunday 23:59:59 Lima time)
  const end = new Date(targetMonday);
  end.setUTCDate(targetMonday.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);

  return { start, end };
}

function getMonthlyRange(year: number, month: number) {
  // month is 0-indexed (0 = January)
  // Start of month (1st day 00:00:00 Lima time = 05:00:00 UTC)
  const start = new Date(Date.UTC(year, month, 1, 5, 0, 0, 0));

  // End of month (last day 23:59:59 Lima time)
  const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

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
