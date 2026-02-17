// app/(admin)/settings/reports/ReportsView.tsx
"use client";

import { useState, useEffect } from "react";
import { format, getWeek, getYear } from "date-fns";
import { useActionState } from "react";
import { toZonedTime } from "date-fns-tz";
import {
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
  getOrdersForPeriod,
  getVoidRecordsCount,
  getExpensesForPeriod,
} from "./actions";
import Link from "next/link";

const TIMEZONE = "America/Lima";

// Types
type ReportData = {
  total: number;
  cash: number;
  yape: number;
  expenses: number;
  period: string;
};

type OrderItem = {
  id: string;
  customerName: string | null;
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
};

type ExpenseItem = {
  id: string;
  name: string;
  cost: number;
  notes: string | null;
  createdAt: string;
};

// ✅ Helper: Get today's date in Lima timezone as YYYY-MM-DD string
function getTodayLimaDateString() {
  const now = new Date();
  const limaDate = toZonedTime(now, TIMEZONE);
  return format(limaDate, "yyyy-MM-dd");
}

// ✅ Helper: Format date string for display (input is YYYY-MM-DD)
function formatDateForDisplay(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return format(date, "dd/MM/yyyy");
}

// Action functions
async function fetchDailyReport(prevState: ReportData | null, date: string) {
  const result = await getDailyReport(date);
  return {
    ...result,
    period: `Día: ${formatDateForDisplay(date)}`,
  };
}

async function fetchWeeklyReport(
  prevState: ReportData | null,
  payload: { year: number; week: number },
) {
  const { year, week } = payload;
  const result = await getWeeklyReport(year, week);
  return {
    ...result.data,
    period: `Semana del ${formatDateForDisplay(result.start)} al ${formatDateForDisplay(
      result.end,
    )}`,
  };
}

async function fetchMonthlyReport(
  prevState: ReportData | null,
  payload: { year: number; month: number },
) {
  const { year, month } = payload;
  const result = await getMonthlyReport(year, month);
  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  return {
    ...result.data,
    period: `${monthNames[month]} ${year}`,
  };
}

// ✅ Helper: format time in Lima timezone
function formatLimaTime(date: Date | string, formatStr: string = "HH:mm") {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(toZonedTime(d, TIMEZONE), formatStr);
}

export default function ReportsView() {
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly">(
    "daily",
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    getTodayLimaDateString(),
  );
  const today = toZonedTime(new Date(), TIMEZONE);
  const [weekYear, setWeekYear] = useState<number>(getYear(today));
  const [weekNumber, setWeekNumber] = useState<number>(
    getWeek(today, { weekStartsOn: 1 }),
  );
  const [monthYear, setMonthYear] = useState<number>(today.getFullYear());
  const [month, setMonth] = useState<number>(today.getMonth());

  const [dailyReport, fetchDaily] = useActionState(fetchDailyReport, null);
  const [weeklyReport, fetchWeekly] = useActionState(fetchWeeklyReport, null);
  const [monthlyReport, fetchMonthly] = useActionState(
    fetchMonthlyReport,
    null,
  );

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [voidCount, setVoidCount] = useState<number>(0);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  // Fetch initial report
  useEffect(() => {
    fetchDaily(selectedDate);
  }, []);

  // Fetch data when params change
  useEffect(() => {
    const fetchData = async () => {
      setLoadingOrders(true);

      if (activeTab === "daily") {
        await fetchDaily(selectedDate);
        const ordersData = await getOrdersForPeriod("daily", selectedDate);
        const voids = await getVoidRecordsCount("daily", selectedDate);
        const expenseData = await getExpensesForPeriod("daily", selectedDate);
        setOrders(ordersData);
        setVoidCount(voids);
        setExpenses(expenseData);
      } else if (activeTab === "weekly") {
        await fetchWeekly({ year: weekYear, week: weekNumber });
        const ordersData = await getOrdersForPeriod(
          "weekly",
          weekYear.toString(),
          weekNumber.toString(),
        );
        const voids = await getVoidRecordsCount("weekly", weekYear, weekNumber);
        const expenseData = await getExpensesForPeriod(
          "weekly",
          weekYear,
          weekNumber,
        );
        setOrders(ordersData);
        setVoidCount(voids);
        setExpenses(expenseData);
      } else {
        await fetchMonthly({ year: monthYear, month });
        const ordersData = await getOrdersForPeriod(
          "monthly",
          monthYear.toString(),
          month.toString(),
        );
        const voids = await getVoidRecordsCount("monthly", monthYear, month);
        const expenseData = await getExpensesForPeriod(
          "monthly",
          monthYear,
          month,
        );
        setOrders(ordersData);
        setVoidCount(voids);
        setExpenses(expenseData);
      }

      setLoadingOrders(false);
      setCurrentPage(1);
    };

    fetchData();
  }, [activeTab, selectedDate, weekYear, weekNumber, monthYear, month]);

  const currentReport =
    activeTab === "daily"
      ? dailyReport
      : activeTab === "weekly"
        ? weeklyReport
        : monthlyReport;

  // Pagination
  const totalPages = Math.ceil(orders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const currentOrders = orders.slice(startIndex, startIndex + ordersPerPage);

  // Chart data
  const chartData = currentReport
    ? [
        { name: "Efectivo", value: currentReport.cash },
        { name: "Yape", value: currentReport.yape },
      ]
    : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Reportes de Ventas
      </h1>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        {(["daily", "weekly", "monthly"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium ${
              activeTab === tab
                ? "text-rose-700 border-b-2 border-rose-700"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {tab === "daily"
              ? "Diario"
              : tab === "weekly"
                ? "Semanal"
                : "Mensual"}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        {activeTab === "daily" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecciona la fecha
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-gray-800"
            />
          </div>
        )}

        {activeTab === "weekly" && (
          <div className="flex items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Año
              </label>
              <input
                type="number"
                value={weekYear}
                onChange={(e) => setWeekYear(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded text-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Semana
              </label>
              <input
                type="number"
                min="1"
                max="53"
                value={weekNumber}
                onChange={(e) => setWeekNumber(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded text-gray-800"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  const prevWeek = new Date(weekYear, 0, 1);
                  prevWeek.setDate(prevWeek.getDate() - 7);
                  setWeekYear(prevWeek.getFullYear());
                  setWeekNumber(
                    getWeek(toZonedTime(prevWeek, TIMEZONE), {
                      weekStartsOn: 1,
                    }),
                  );
                }}
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                ← Semana Anterior
              </button>
              <button
                onClick={() => {
                  const today = toZonedTime(new Date(), TIMEZONE);
                  setWeekYear(getYear(today));
                  setWeekNumber(getWeek(today, { weekStartsOn: 1 }));
                }}
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Hoy
              </button>
              <button
                onClick={() => {
                  const nextWeek = new Date(weekYear, 0, 1);
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  setWeekYear(nextWeek.getFullYear());
                  setWeekNumber(
                    getWeek(toZonedTime(nextWeek, TIMEZONE), {
                      weekStartsOn: 1,
                    }),
                  );
                }}
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Siguiente Semana →
              </button>
            </div>
          </div>
        )}

        {activeTab === "monthly" && (
          <div className="flex items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Año
              </label>
              <input
                type="number"
                value={monthYear}
                onChange={(e) => setMonthYear(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded text-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mes
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded text-gray-800"
              >
                {[
                  "Enero",
                  "Febrero",
                  "Marzo",
                  "Abril",
                  "Mayo",
                  "Junio",
                  "Julio",
                  "Agosto",
                  "Septiembre",
                  "Octubre",
                  "Noviembre",
                  "Diciembre",
                ].map((name, idx) => (
                  <option key={idx} value={idx}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  const prev = new Date(monthYear, month, 1);
                  prev.setMonth(prev.getMonth() - 1);
                  setMonthYear(prev.getFullYear());
                  setMonth(prev.getMonth());
                }}
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                ← Mes Anterior
              </button>
              <button
                onClick={() => {
                  const today = toZonedTime(new Date(), TIMEZONE);
                  setMonthYear(today.getFullYear());
                  setMonth(today.getMonth());
                }}
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Hoy
              </button>
              <button
                onClick={() => {
                  const next = new Date(monthYear, month, 1);
                  next.setMonth(next.getMonth() + 1);
                  setMonthYear(next.getFullYear());
                  setMonth(next.getMonth());
                }}
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Siguiente Mes →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Report Summary */}
      {currentReport ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Desglose de Ventas
            </h2>
            <div className="flex items-end h-48 space-x-4">
              {chartData.map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full bg-gray-200 rounded-t"
                    style={{
                      height: "100%",
                      paddingBottom: "4px",
                      display: "flex",
                      alignItems: "flex-end",
                    }}
                  >
                    <div
                      className={`w-full rounded-t ${
                        item.name === "Efectivo"
                          ? "bg-green-500"
                          : "bg-purple-500"
                      }`}
                      style={{
                        height: `${
                          (item.value / currentReport.total) * 100 || 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="mt-2 text-sm font-medium">{item.name}</span>
                  <span className="text-xs text-gray-600">
                    S/ {item.value.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {currentReport.period}
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Ventas:</span>
                <span className="font-bold text-blue-800">
                  S/ {currentReport.total.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Gastos:</span>
                <span className="font-bold text-rose-700">
                  - S/ {currentReport.expenses.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-bold">Balance Neto:</span>
                <span className="font-bold text-gray-800">
                  S/ {(currentReport.total - currentReport.expenses).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Efectivo:</span>
                <span className="font-bold text-green-800">
                  S/ {currentReport.cash.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Yape:</span>
                <span className="font-bold text-purple-800">
                  S/ {currentReport.yape.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pedidos:</span>
                <span className="font-bold text-gray-800">{orders.length}</span>
              </div>
              {voidCount > 0 && (
                <div className="mt-4">
                  <Link
                    href={`/settings/void-records?date=${
                      activeTab === "daily" ? selectedDate : ""
                    }`}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Ver {voidCount} anulaciones →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-gray-600 mb-8">Cargando reporte...</div>
      )}

      {/* Expenses Section */}
      {expenses.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">Gastos</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Concepto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hora
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-rose-700">
                      {expense.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold">
                        S/ {expense.cost.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                      {expense.notes || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatLimaTime(expense.createdAt, "HH:mm")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 bg-gray-50 flex justify-between items-center">
            <span className="text-sm text-gray-700">
              Total Gastos:{" "}
              <span className="font-bold text-rose-700">
                S/ {expenses.reduce((sum, e) => sum + e.cost, 0).toFixed(2)}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-10">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">Pedidos</h2>
        </div>

        {loadingOrders ? (
          <div className="p-8 text-center text-gray-600">
            Cargando pedidos...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            No hay pedidos en este período.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Método
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hora
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className={
                        order.status === "CANCELLED" ? "bg-red-50" : ""
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.customerName || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        S/ {order.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            order.paymentMethod === "CASH"
                              ? "bg-green-100 text-green-800"
                              : order.paymentMethod === "YAPE"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {order.paymentMethod === "CASH"
                            ? "Efectivo"
                            : order.paymentMethod === "YAPE"
                              ? "Yape"
                              : "Mixto"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            order.status === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : order.status === "CANCELLED"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {order.status === "COMPLETED"
                            ? "Completado"
                            : order.status === "CANCELLED"
                              ? "Anulado"
                              : "Pendiente"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatLimaTime(order.createdAt, "HH:mm")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando{" "}
                  <span className="font-medium">{startIndex + 1}</span> a{" "}
                  <span className="font-medium">
                    {Math.min(startIndex + ordersPerPage, orders.length)}
                  </span>{" "}
                  de <span className="font-medium">{orders.length}</span>{" "}
                  resultados
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1 text-gray-700">
                    {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
