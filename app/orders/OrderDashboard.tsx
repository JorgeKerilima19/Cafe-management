// app/(admin)/order/OrderDashboard.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { format, differenceInMinutes } from "date-fns";
import { completeOrder, getTodaysOrders } from "./actions";
import VoidModal from "./VoidModal";

type Order = {
  id: string;
  customerName: string | null;
  total: number;
  status: string;
  createdAt: Date;
  user: { name: string } | null;
};

export default function OrderDashboard({
  initialOrders,
}: {
  initialOrders: Order[];
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [lastFetchTime, setLastFetchTime] = useState<Date>(() => new Date());
  const [voidingOrderId, setVoidingOrderId] = useState<string | null>(null);
  const previousOrderIds = useRef(new Set(initialOrders.map((o) => o.id)));
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Preload sound
  useEffect(() => {
    if (typeof Audio !== "undefined") {
      audioRef.current = new Audio("/notification.mp3");
    }
  }, []);

  // ✅ Fix useEffect dependency: NO dependency array → runs once
  useEffect(() => {
    const poll = async () => {
      try {
        const newOrders = await getTodaysOrders();
        const newOrderIds = new Set(newOrders.map((o) => o.id));
        const isNewOrder = newOrders.some(
          (order) => !previousOrderIds.current.has(order.id)
        );

        if (isNewOrder && audioRef.current) {
          audioRef.current
            .play()
            .catch((e) => console.warn("Audio play failed:", e));
        }

        // ✅ Merge orders: keep existing + add new (no duplicates)
        const mergedOrders = [...orders];
        for (const newOrder of newOrders) {
          const existingIndex = mergedOrders.findIndex(
            (o) => o.id === newOrder.id
          );
          if (existingIndex === -1) {
            mergedOrders.push(newOrder); // Append new to end
          } else {
            mergedOrders[existingIndex] = newOrder; // Update existing
          }
        }

        // ✅ Sort by createdAt ASC (oldest first)
        mergedOrders.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        );

        setOrders(mergedOrders);
        previousOrderIds.current = newOrderIds;
        setLastFetchTime(new Date());
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []); // ✅ Empty dependency array → runs once on mount

  const getOrderBgColor = (createdAt: Date) => {
    const minutes = differenceInMinutes(new Date(), createdAt);
    if (minutes < 5) return "bg-green-50";
    if (minutes < 10) return "bg-yellow-50";
    return "bg-red-50";
  };

  const pendingOrders = orders.filter(
    (o) => o.status !== "COMPLETED" && o.status !== "CANCELLED"
  );
  const completedOrders = orders.filter(
    (o) => o.status === "COMPLETED" || o.status === "CANCELLED"
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pedidos de Hoy</h1>
        <div
          className="text-sm text-gray-600"
          suppressHydrationWarning // ✅ Fixes time mismatch
        >
          Última actualización: {format(lastFetchTime, "HH:mm:ss")}
        </div>
      </div>

      {/* Pending Orders */}
      <h2 className="text-xl font-bold text-gray-800 mb-3">
        Pedidos Pendientes
      </h2>
      {pendingOrders.length === 0 ? (
        <p className="text-gray-600 mb-8">No hay pedidos pendientes.</p>
      ) : (
        <div className="space-y-3 mb-8">
          {pendingOrders.map((order) => (
            <div
              key={order.id}
              className={`p-4 rounded-lg border ${getOrderBgColor(
                order.createdAt
              )}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">
                    {order.customerName || "Pedido"}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {format(order.createdAt, "HH:mm")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">
                    S/ {order.total.toFixed(2)}
                  </p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === "PENDING"
                        ? "bg-gray-200 text-gray-800"
                        : order.status === "PAID"
                        ? "bg-blue-200 text-blue-800"
                        : order.status === "PREPARING"
                        ? "bg-purple-200 text-purple-800"
                        : order.status === "READY"
                        ? "bg-orange-200 text-orange-800"
                        : "bg-green-200 text-green-800"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
              {order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
                <div className="flex gap-2 mt-3">
                  <form action={completeOrder}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      Entregar
                    </button>
                  </form>
                  <button
                    type="button"
                    onClick={() => setVoidingOrderId(order.id)}
                    className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    Anular
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Completed Orders */}
      {completedOrders.length > 0 && (
        <>
          <h2 className="text-xl font-bold text-gray-800 mb-3">
            Pedidos Completados/Anulados
          </h2>
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                    Cliente
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                    Hora
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                    Total
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {completedOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3 text-sm">
                      {order.customerName || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {format(order.createdAt, "HH:mm")}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      S/ {order.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === "COMPLETED"
                            ? "bg-green-200 text-green-800"
                            : "bg-red-200 text-red-800"
                        }`}
                      >
                        {order.status === "COMPLETED"
                          ? "Completado"
                          : "Anulado"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {voidingOrderId && (
        <VoidModal
          orderId={voidingOrderId}
          onClose={() => setVoidingOrderId(null)}
        />
      )}

      <audio src="/notification.mp3" preload="auto" />
    </div>
  );
}
