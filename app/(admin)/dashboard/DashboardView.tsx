// app/(admin)/dashboard/DashboardView.tsx

"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import Link from "next/link";
import {
  openRegister,
  closeRegister,
  createDayExpense,
  updateDayExpense,
  deleteDayExpense,
} from "./actions";

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

function ExpenseItem({
  expense,
  onEdit,
  onDelete,
  isEditing,
  editForm,
  setEditForm,
  saveEdit,
}: {
  expense: {
    id: string;
    name: string;
    cost: number;
    notes: string | null;
    createdAt: string;
  };
  onEdit: (expense: any) => void;
  onDelete: (id: string) => void;
  isEditing: boolean;
  editForm: { name: string; cost: string; notes: string };
  setEditForm: React.Dispatch<
    React.SetStateAction<{ name: string; cost: string; notes: string }>
  >;
  saveEdit: (id: string, formData: typeof editForm) => Promise<void>;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await saveEdit(expense.id, editForm);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing) {
    return (
      <form
        onSubmit={handleSave}
        className="p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-2"
      >
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-shadow"
            placeholder="Nombre"
            required
          />
          <input
            type="number"
            step="0.01"
            value={editForm.cost}
            onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })}
            className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-shadow"
            placeholder="Costo"
            required
          />
        </div>
        <input
          type="text"
          value={editForm.notes}
          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-shadow"
          placeholder="Notas (opcional)"
        />
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-3 py-1.5 text-xs font-medium bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Guardando..." : "Guardar"}
          </button>
          <button
            type="button"
            onClick={() => onEdit(expense)}
            disabled={isSubmitting}
            className="px-3 py-1.5 text-xs font-medium bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 hover:border-amber-200 hover:shadow-sm transition-all group">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-800 truncate">
          {expense.name}
        </p>
        <p className="text-xs text-gray-500">
          {format(new Date(expense.createdAt), "HH:mm")}
          {expense.notes && (
            <span className="ml-2 text-amber-600">• {expense.notes}</span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-3 ml-4">
        <span className="font-bold text-rose-600 whitespace-nowrap">
          S/ {expense.cost.toFixed(2)}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(expense)}
            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors"
            title="Editar"
            aria-label="Editar gasto"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={() => onDelete(expense.id)}
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
            title="Eliminar"
            aria-label="Eliminar gasto"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function ExpenseManager({
  expenses,
  onCreate,
}: {
  expenses: {
    id: string;
    name: string;
    cost: number;
    notes: string | null;
    createdAt: string;
  }[];
  onCreate: (formData: {
    name: string;
    cost: string;
    notes: string;
  }) => Promise<void>;
}) {
  const [form, setForm] = useState({ name: "", cost: "", notes: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", cost: "", notes: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onCreate(form);
      setForm({ name: "", cost: "", notes: "" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (expense: (typeof expenses)[0]) => {
    if (editingId === expense.id) {
      setEditingId(null);
      setEditForm({ name: "", cost: "", notes: "" });
    } else {
      setEditingId(expense.id);
      setEditForm({
        name: expense.name,
        cost: expense.cost.toString(),
        notes: expense.notes || "",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar este gasto?")) {
      const formData = new FormData();
      formData.append("id", id);
      await deleteDayExpense(formData);
    }
  };

  const handleSaveEdit = async (id: string, formData: typeof editForm) => {
    const fd = new FormData();
    fd.append("id", id);
    fd.append("name", formData.name);
    fd.append("cost", formData.cost);
    fd.append("notes", formData.notes);
    await updateDayExpense(fd);
    setEditingId(null);
    setEditForm({ name: "", cost: "", notes: "" });
  };

  const total = expenses.reduce((sum, e) => sum + e.cost, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        <svg
          className="w-5 h-5 text-rose-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Gestión de Gastos
      </h3>

      {/* Create Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-3 mb-5 p-4 bg-gray-50 rounded-lg"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nombre del gasto"
            className="px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-shadow"
            required
          />
          <input
            type="number"
            step="0.01"
            value={form.cost}
            onChange={(e) => setForm({ ...form, cost: e.target.value })}
            placeholder="Costo (S/)"
            className="px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-shadow"
            required
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium bg-rose-600 text-white rounded hover:bg-rose-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            )}
            Agregar
          </button>
        </div>
        <input
          type="text"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Notas adicionales (opcional)"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-shadow"
        />
      </form>

      {/* Expense List */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
        {expenses.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No hay gastos registrados hoy
          </p>
        ) : (
          expenses.map((expense) => (
            <ExpenseItem
              key={expense.id}
              expense={expense}
              onEdit={handleEditClick}
              onDelete={handleDelete}
              isEditing={editingId === expense.id}
              editForm={editForm}
              setEditForm={setEditForm}
              saveEdit={handleSaveEdit}
            />
          ))
        )}
      </div>

      {/* Total */}
      {expenses.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">
            Total gastos:
          </span>
          <span className="text-lg font-bold text-rose-600">
            S/ {total.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}

function CashRegisterCard({
  openRegister,
  cashSales,
  yapeSales,
  onOpen,
  onClose,
}: {
  openRegister: DashboardData["openRegister"];
  cashSales: number;
  yapeSales: number;
  onOpen: (formData: { openingAmount: string; notes: string }) => Promise<void>;
  onClose: (formData: {
    closingAmount: string;
    notes: string;
  }) => Promise<void>;
}) {
  const [openForm, setOpenForm] = useState({ openingAmount: "", notes: "" });
  const [closeForm, setCloseForm] = useState({ closingAmount: "", notes: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (openRegister) {
      const expected = openRegister.openingAmount + cashSales;
      setCloseForm((prev) => ({ ...prev, closingAmount: expected.toString() }));
    }
  }, [openRegister, cashSales]);

  const handleOpenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onOpen(openForm);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onClose(closeForm);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`p-6 rounded-xl shadow-sm border ${
        openRegister
          ? "bg-linear-to-br from-green-50 to-emerald-50 border-green-200"
          : "bg-linear-to-br from-red-50 to-rose-50 border-red-200"
      }`}
    >
      <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        {openRegister ? (
          <>
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            Caja Abierta
          </>
        ) : (
          <>
            <span className="w-3 h-3 bg-red-500 rounded-full" />
            Caja Cerrada
          </>
        )}
      </h2>

      {openRegister ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-white/60 p-3 rounded-lg">
              <p className="text-gray-500 text-xs uppercase tracking-wide">
                Abierta por
              </p>
              <p className="font-semibold text-gray-800">
                {openRegister.openedBy.name}
              </p>
            </div>
            <div className="bg-white/60 p-3 rounded-lg">
              <p className="text-gray-500 text-xs uppercase tracking-wide">
                Hora
              </p>
              <p className="font-semibold text-gray-800">
                {format(new Date(openRegister.openedAt), "HH:mm")}
              </p>
            </div>
            <div className="bg-white/60 p-3 rounded-lg">
              <p className="text-gray-500 text-xs uppercase tracking-wide">
                Monto inicial
              </p>
              <p className="font-bold text-green-700">
                S/ {openRegister.openingAmount.toFixed(2)}
              </p>
            </div>
            <div className="bg-white/60 p-3 rounded-lg">
              <p className="text-gray-500 text-xs uppercase tracking-wide">
                Ventas Yape
              </p>
              <p className="font-bold text-purple-700">
                S/ {yapeSales.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="bg-white/80 p-4 rounded-lg border border-green-100">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Efectivo en caja:</span> S/{" "}
              {cashSales.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Total esperado:</span>{" "}
              <span className="font-bold text-green-700">
                S/ {(openRegister.openingAmount + cashSales).toFixed(2)}
              </span>
            </p>
          </div>

          <form onSubmit={handleCloseSubmit} className="space-y-3 pt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto de cierre (S/)
              </label>
              <input
                type="number"
                step="0.01"
                value={closeForm.closingAmount}
                onChange={(e) =>
                  setCloseForm({ ...closeForm, closingAmount: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-shadow"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas de cierre (opcional)
              </label>
              <textarea
                value={closeForm.notes}
                onChange={(e) =>
                  setCloseForm({ ...closeForm, notes: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-shadow"
                rows={2}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              )}
              Cerrar Caja
            </button>
          </form>
        </div>
      ) : (
        <form onSubmit={handleOpenSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto inicial (S/) - Dinero para cambio
            </label>
            <input
              type="number"
              step="0.01"
              value={openForm.openingAmount}
              onChange={(e) =>
                setOpenForm({ ...openForm, openingAmount: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-shadow"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas (opcional)
            </label>
            <textarea
              value={openForm.notes}
              onChange={(e) =>
                setOpenForm({ ...openForm, notes: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-shadow"
              rows={2}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                />
              </svg>
            )}
            Abrir Caja
          </button>
        </form>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-component: Today Summary Stats
// ─────────────────────────────────────────────────────────────
function TodaySummary({
  total,
  cash,
  yape,
  expenses,
  orderCount,
  voidCount,
}: {
  total: number;
  cash: number;
  yape: number;
  expenses: number;
  orderCount: number;
  voidCount: number;
}) {
  const balance = total - expenses;

  const stats = [
    {
      label: "Total Ventas",
      value: `S/ ${total.toFixed(2)}`,
      color: "text-blue-700",
      bg: "bg-blue-50",
    },
    {
      label: "Efectivo",
      value: `S/ ${cash.toFixed(2)}`,
      color: "text-green-700",
      bg: "bg-green-50",
    },
    {
      label: "Yape",
      value: `S/ ${yape.toFixed(2)}`,
      color: "text-purple-700",
      bg: "bg-purple-50",
    },
    {
      label: "Gastos",
      value: `S/ ${expenses.toFixed(2)}`,
      color: "text-rose-700",
      bg: "bg-rose-50",
    },
    {
      label: "Pedidos",
      value: orderCount.toString(),
      color: "text-gray-700",
      bg: "bg-gray-50",
    },
    {
      label: "Balance",
      value: `S/ ${balance.toFixed(2)}`,
      color: balance >= 0 ? "text-emerald-700" : "text-red-700",
      bg: balance >= 0 ? "bg-emerald-50" : "bg-red-50",
      bold: true,
    },
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <svg
          className="w-5 h-5 text-blue-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        Resumen de Hoy
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className={`${stat.bg} p-3 rounded-lg`}>
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              {stat.label}
            </p>
            <p
              className={`text-lg font-semibold ${stat.color} ${stat.bold ? "font-bold" : ""}`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>
      {voidCount > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <Link
            href="/settings/void-records"
            className="flex items-center justify-between text-sm text-red-600 hover:text-red-800 font-medium group"
          >
            <span className="group-hover:underline">Ver anulaciones</span>
            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">
              {voidCount}
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}

function QuickActions() {
  const actions = [
    {
      href: "/orders",
      label: "Pedidos Actuales",
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      href: "/settings/reports",
      label: "Reportes",
      color: "bg-purple-600 hover:bg-purple-700",
    },
    {
      href: "/menu",
      label: "Tomar Pedido",
      color: "bg-rose-600 hover:bg-rose-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {actions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className={`${action.color} text-white p-4 rounded-xl text-center font-medium transition-all hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2`}
        >
          {action.label}
        </Link>
      ))}
    </div>
  );
}

export default function DashboardView({
  initialData,
}: {
  initialData: DashboardData;
}) {
  const total = initialData.todaySales._sum.total;
  const cash = initialData.todaySales._sum.cashAmount;
  const yape = initialData.todaySales._sum.yapeAmount;
  const orderCount = initialData.todaySales._count.id;
  const expenseTotal = initialData.todayExpenses.total;

  const handleOpenRegister = async (formData: {
    openingAmount: string;
    notes: string;
  }) => {
    const fd = new FormData();
    fd.append("openingAmount", formData.openingAmount);
    fd.append("notes", formData.notes);
    await openRegister(fd);
  };

  const handleCloseRegister = async (formData: {
    closingAmount: string;
    notes: string;
  }) => {
    const fd = new FormData();
    fd.append("closingAmount", formData.closingAmount);
    fd.append("notes", formData.notes);
    await closeRegister(fd);
  };

  const handleCreateExpense = async (formData: {
    name: string;
    cost: string;
    notes: string;
  }) => {
    const fd = new FormData();
    fd.append("name", formData.name);
    fd.append("cost", formData.cost);
    fd.append("notes", formData.notes);
    await createDayExpense(fd);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Panel de Control</h1>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {format(new Date(), "EEEE, d 'de' MMMM")}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CashRegisterCard
          openRegister={initialData.openRegister}
          cashSales={cash}
          yapeSales={yape}
          onOpen={handleOpenRegister}
          onClose={handleCloseRegister}
        />
        <TodaySummary
          total={total}
          cash={cash}
          yape={yape}
          expenses={expenseTotal}
          orderCount={orderCount}
          voidCount={initialData.voidCount}
        />
      </div>

      {initialData.openRegister && (
        <ExpenseManager
          expenses={initialData.todayExpenses.list}
          onCreate={handleCreateExpense}
        />
      )}

      <QuickActions />
    </div>
  );
}
