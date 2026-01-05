// app/(admin)/order/OrderDashboard.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { format, differenceInMinutes } from "date-fns";
import { completeOrder, getTodaysOrders } from "./actions";
import VoidModal from "./VoidModal";

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  customerName: string | null;
  total: number;
  status: string;
  createdAt: Date;
  user: { name: string } | null;
  paymentMethod: string;
  cashAmount: number;
  yapeAmount: number;
  items: OrderItem[];
};

// ✅ Helper: format payment method
const getPaymentMethodDisplay = (method: string) => {
  switch (method) {
    case "CASH":
      return "Efectivo";
    case "YAPE":
      return "Yape";
    case "MIXED":
      return "Mixto";
    default:
      return method;
  }
};

// ✅ Print function
function printReceipt(order: Order) {
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument!;
  const win = iframe.contentWindow!;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Recibo - Cafetería La Goutte</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 14px; margin: 0; padding: 10px; }
        .header { text-align: center; margin-bottom: 10px; }
        .items { margin: 10px 0; }
        .item { display: flex; justify-content: space-between; margin: 4px 0; }
        .total { font-weight: bold; margin-top: 10px; text-align: right; font-size: 16px; }
        .footer { text-align: center; margin-top: 15px; font-size: 12px; }
        .method { font-size: 12px; margin-top: 5px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>Cafetería La Goutte</h2>
        <p>${format(order.createdAt, "dd/MM/yyyy HH:mm")}</p>
      </div>
      <p>${order.customerName || "Pedido"}</p>
      
      <div class="items">
        ${
          order.items.length > 0
            ? order.items
                .map(
                  (item) => `
                  <div class="item">
                    <span>${item.name}</span>
                    <span>S/ ${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                  <div class="item-details">
                    <span>  ${item.quantity} × S/ ${item.price.toFixed(2)}</span>
                  </div>
                `
                )
                .join("")
            : '<div class="item"><span>Sin detalles</span></div>'
        }
      </div>
      
      <div class="total">Total: S/ ${order.total.toFixed(2)}</div>
      
      <div class="method">
        Método: ${getPaymentMethodDisplay(order.paymentMethod)}
        ${
          order.paymentMethod === "MIXED"
            ? `<br>Efectivo: S/ ${order.cashAmount.toFixed(
                2
              )} | Yape: S/ ${order.yapeAmount.toFixed(2)}`
            : ""
        }
      </div>
      
      <div class="footer">
        ¡Gracias por su compra!
      </div>
    </body>
    </html>
  `);
  doc.close();

  win.focus();
  win.print();

  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 1000);
}

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

  useEffect(() => {
    if (typeof Audio !== "undefined") {
      audioRef.current = new Audio("/notification.mp3");
    }
  }, []);

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

        const mergedOrders = [...orders];
        for (const newOrder of newOrders) {
          const existingIndex = mergedOrders.findIndex(
            (o) => o.id === newOrder.id
          );
          if (existingIndex === -1) {
            mergedOrders.push(newOrder);
          } else {
            mergedOrders[existingIndex] = newOrder;
          }
        }

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
  }, []);

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
        <div className="text-sm text-gray-600" suppressHydrationWarning>
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
                  <div className="mt-2">
                    <ul className="mt-1 space-y-1">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="text-lg text-gray-600">
                          • {item.name} ×{item.quantity} (S/{" "}
                          {(item.price * item.quantity).toFixed(2)})
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* ✅ LARGER Payment Method & Amounts */}
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        Método:
                      </span>
                      <span
                        className={`text-sm px-2 py-0.5 rounded-full ${
                          order.paymentMethod === "CASH"
                            ? "bg-green-200 text-green-800"
                            : order.paymentMethod === "YAPE"
                            ? "bg-purple-200 text-purple-800"
                            : "bg-blue-200 text-blue-800"
                        }`}
                      >
                        {getPaymentMethodDisplay(order.paymentMethod)}
                      </span>
                    </div>

                    {order.paymentMethod === "MIXED" ? (
                      <div className="text-sm text-gray-700">
                        <span className="text-green-700 font-medium">
                          Efectivo: S/ {order.cashAmount.toFixed(2)}
                        </span>{" "}
                        •
                        <span className="text-purple-700 ml-2 font-medium">
                          Yape: S/ {order.yapeAmount.toFixed(2)}
                        </span>
                      </div>
                    ) : order.paymentMethod === "CASH" ? (
                      <div className="text-sm text-green-700 font-medium">
                        Efectivo: S/ {order.total.toFixed(2)}
                      </div>
                    ) : (
                      <div className="text-sm text-purple-700 font-medium">
                        Yape: S/ {order.total.toFixed(2)}
                      </div>
                    )}
                  </div>
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
                  {/* ✅ Print button for pending orders */}
                  <button
                    type="button"
                    onClick={() => printReceipt(order)}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    🖨️ Imprimir
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
                    Método
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                    Monto
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                    Hora
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
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          order.paymentMethod === "CASH"
                            ? "bg-green-200 text-green-800"
                            : order.paymentMethod === "YAPE"
                            ? "bg-purple-200 text-purple-800"
                            : "bg-blue-200 text-blue-800"
                        }`}
                      >
                        {getPaymentMethodDisplay(order.paymentMethod)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {order.paymentMethod === "MIXED" ? (
                        <div>
                          <div className="text-green-700">
                            Efectivo: S/ {order.cashAmount.toFixed(2)}
                          </div>
                          <div className="text-purple-700">
                            Yape: S/ {order.yapeAmount.toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        <span
                          className={
                            order.paymentMethod === "CASH"
                              ? "text-green-700"
                              : "text-purple-700"
                          }
                        >
                          S/ {order.total.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {format(order.createdAt, "HH:mm")}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2 items-center">
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
                        {order.status === "COMPLETED" && (
                          <button
                            onClick={() => printReceipt(order)}
                            className="text-blue-600 hover:text-blue-800 text-xs"
                          >
                            🖨️ Imprimir
                          </button>
                        )}
                      </div>
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
