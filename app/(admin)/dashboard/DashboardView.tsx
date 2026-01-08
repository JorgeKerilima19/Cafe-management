// app/(admin)/dashboard/DashboardView.tsx
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { openRegister, closeRegister, createDayExpense } from "./actions";

type DashboardData = {
  openRegister: {
    id: string;
    openingAmount: number;
    openedAt: string;
    openedBy: { name: string };
  } | null;
  todaySales: {
    _sum: { total: number; cashAmount: number; yapeAmount: number };
    _count: { id: number };
  };
  voidCount: number;
  todayExpenses: {
    list: {
      id: string;
      name: string;
      cost: number;
      notes: string | null;
      createdAt: string;
    }[];
    total: number;
  };
};

export default function DashboardView({
  initialData,
}: {
  initialData: DashboardData;
}) {
  const [openAmount, setOpenAmount] = useState("");
  const [closeAmount, setCloseAmount] = useState("");
  const [openNotes, setOpenNotes] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [expenseName, setExpenseName] = useState("");
  const [expenseCost, setExpenseCost] = useState("");
  const [expenseNotes, setExpenseNotes] = useState("");

  useEffect(() => {
    if (initialData.openRegister) {
      const cashSales = initialData.todaySales._sum.cashAmount || 0;
      const expectedClosing =
        initialData.openRegister.openingAmount + cashSales;
      setCloseAmount(expectedClosing.toString());
    }
  }, [initialData]);

  const total = initialData.todaySales._sum.total;
  const cash = initialData.todaySales._sum.cashAmount;
  const yape = initialData.todaySales._sum.yapeAmount;
  const orderCount = initialData.todaySales._count.id;
  const expenseTotal = initialData.todayExpenses.total;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Panel de Control
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div
          className={`p-6 rounded-xl shadow-sm ${
            initialData.openRegister
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <h2 className="text-lg font-bold mb-4">
            {initialData.openRegister ? "Caja Abierta" : "Caja Cerrada"}
          </h2>

          {initialData.openRegister ? (
            <div>
              <p>
                <span className="font-medium">Abierta por:</span>{" "}
                {initialData.openRegister.openedBy.name}
              </p>
              <p>
                <span className="font-medium">Hora:</span>{" "}
                {format(new Date(initialData.openRegister.openedAt), "HH:mm")}
              </p>
              <p>
                <span className="font-medium">Monto inicial:</span> S/{" "}
                {initialData.openRegister.openingAmount.toFixed(2)}
              </p>
              <p>
                <span className="font-medium">Ventas en efectivo:</span> S/{" "}
                {cash.toFixed(2)}
              </p>
              <p>
                <span className="font-medium">Total esperado:</span> S/{" "}
                {(initialData.openRegister.openingAmount + cash).toFixed(2)}
              </p>

              {/* Expense Section */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="font-bold text-md mb-2">Registrar Gasto</h3>
                <form action={createDayExpense} className="space-y-2">
                  <input type="hidden" name="name" value={expenseName} />
                  <input type="hidden" name="cost" value={expenseCost} />
                  <input type="hidden" name="notes" value={expenseNotes} />

                  <div>
                    <input
                      type="text"
                      value={expenseName}
                      onChange={(e) => setExpenseName(e.target.value)}
                      placeholder="Nombre del gasto (e.g., Taxi)"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={expenseCost}
                      onChange={(e) => setExpenseCost(e.target.value)}
                      placeholder="Costo (S/)"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      required
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 bg-rose-600 text-white text-sm rounded hover:bg-rose-700"
                    >
                      Registrar
                    </button>
                  </div>
                  <textarea
                    value={expenseNotes}
                    onChange={(e) => setExpenseNotes(e.target.value)}
                    placeholder="Notas (opcional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    rows={1}
                  />
                </form>

                {initialData.todayExpenses.list.length > 0 && (
                  <div className="mt-4 p-2 bg-rose-50 rounded">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Gastos de hoy:</span>
                      <span className="font-bold text-rose-700">
                        S/ {expenseTotal.toFixed(2)}
                      </span>
                    </div>
                    <ul className="mt-1 space-y-1 text-xs">
                      {initialData.todayExpenses.list
                        .slice(0, 3)
                        .map((expense) => (
                          <li key={expense.id} className="text-gray-700">
                            • {expense.name} (S/ {expense.cost.toFixed(2)})
                          </li>
                        ))}
                      {initialData.todayExpenses.list.length > 3 && (
                        <li className="text-gray-500">
                          +{initialData.todayExpenses.list.length - 3} más
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <form action={closeRegister} className="mt-4 space-y-3">
                <input type="hidden" name="closingAmount" value={closeAmount} />
                <input type="hidden" name="notes" value={closeNotes} />

                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Monto de cierre (S/)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={closeAmount}
                    onChange={(e) => setCloseAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={closeNotes}
                    onChange={(e) => setCloseNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    rows={2}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-red-600 text-white py-2 rounded font-medium hover:bg-red-700"
                >
                  Cerrar Caja
                </button>
              </form>
            </div>
          ) : (
            <form action={openRegister} className="space-y-3">
              <input type="hidden" name="openingAmount" value={openAmount} />
              <input type="hidden" name="notes" value={openNotes} />

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Monto inicial (S/) - Dinero para cambio
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={openAmount}
                  onChange={(e) => setOpenAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  value={openNotes}
                  onChange={(e) => setOpenNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows={2}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700"
              >
                Abrir Caja
              </button>
            </form>
          )}
        </div>

        {/* Today's Summary */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-bold mb-4">Resumen de Hoy</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Ventas:</span>
              <span className="font-bold text-blue-800">
                S/ {total.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Efectivo:</span>
              <span className="font-bold text-green-800">
                S/ {cash.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Yape:</span>
              <span className="font-bold text-purple-800">
                S/ {yape.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Gastos:</span>
              <span className="font-bold text-rose-700">
                S/ {expenseTotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pedidos:</span>
              <span className="font-bold text-gray-800">{orderCount}</span>
            </div>
            {initialData.voidCount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Anulaciones:</span>
                <Link
                  href="/settings/void-records"
                  className="font-bold text-red-600 hover:text-red-800"
                >
                  {initialData.voidCount}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/orders"
          className="bg-blue-600 text-white p-4 rounded-lg text-center hover:bg-blue-700"
        >
          Pedidos Actuales
        </Link>
        <Link
          href="/settings/reports"
          className="bg-purple-600 text-white p-4 rounded-lg text-center hover:bg-purple-700"
        >
          Reportes
        </Link>
        <Link
          href="/menu"
          className="bg-rose-600 text-white p-4 rounded-lg text-center hover:bg-rose-700"
        >
          Tomar Pedido
        </Link>
      </div>
    </div>
  );
}
