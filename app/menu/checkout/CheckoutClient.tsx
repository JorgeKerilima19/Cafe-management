// app/menu/checkout/CheckoutClient.tsx
"use client";

import { createOrder } from "../actions";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export default function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cartParam = searchParams.get("cart");
  const [cartData, setCartData] = useState<{
    items: CartItem[];
    total: number;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "YAPE" | "MIXED">(
    "CASH",
  );
  const [cashAmount, setCashAmount] = useState<string>("");
  const [yapeAmount, setYapeAmount] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");

  useEffect(() => {
    if (!cartParam) {
      router.push("/menu");
      return;
    }

    try {
      const data = JSON.parse(atob(cartParam));
      if (!Array.isArray(data.items) || typeof data.total !== "number")
        throw new Error();
      setCartData(data);
    } catch {
      router.push("/menu");
    }
  }, [cartParam, router]);

  if (!cartData) return null;

  const { items, total } = cartData;

  const getCashAmount = () => {
    if (paymentMethod === "MIXED") return cashAmount;
    if (paymentMethod === "CASH") return total.toString();
    return "0";
  };

  const getYapeAmount = () => {
    if (paymentMethod === "MIXED") return yapeAmount;
    if (paymentMethod === "YAPE") return total.toString();
    return "0";
  };

  const yapeAmountNum = parseFloat(getYapeAmount()) || 0;
  const showYapeQr =
    (paymentMethod === "YAPE" || paymentMethod === "MIXED") &&
    yapeAmountNum > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link href="/menu" className="text-rose-700 hover:text-rose-800">
            &larr; Volver al menú
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Confirmar Pedido
        </h1>

        <div className="bg-white rounded-xl p-4 mb-6">
          <h2 className="font-bold text-lg mb-3">Tu Pedido</h2>
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex justify-between py-2 border-b border-gray-100"
            >
              <span>
                {item.name} ×{item.quantity}
              </span>
              <span className="font-medium">
                S/ {(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-xl mt-3 pt-3 border-t border-gray-200">
            <span>Total:</span>
            <span className="text-rose-700">S/ {total.toFixed(2)}</span>
          </div>
        </div>

        {/* ✅ Static Yape QR Code */}
        {showYapeQr && (
          <div className="bg-white rounded-xl p-4 mb-6 border border-blue-200">
            <h2 className="font-bold text-lg mb-3 text-blue-800">
              Paga con Yape
            </h2>
            <div className="flex flex-col items-center">
              <div className="bg-gray-100 p-3 rounded-lg">
                <img
                  src="/uploads/yape.jpeg"
                  alt="Yape QR Code"
                  className="w-48 h-48 object-contain"
                />
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Escanea el código QR con la app de Yape
              </p>
              <p className="text-sm text-gray-600">
                Monto a pagar: S/ {yapeAmountNum.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* ✅ Simple form with direct action */}
        <form action={createOrder} method="post" className="space-y-4">
          {/* Hidden fields */}
          <input type="hidden" name="items" value={JSON.stringify(items)} />
          <input type="hidden" name="total" value={total.toString()} />
          <input type="hidden" name="paymentMethod" value={paymentMethod} />
          <input type="hidden" name="cashAmount" value={getCashAmount()} />
          <input type="hidden" name="yapeAmount" value={getYapeAmount()} />

          <div>
            <label className="block text-gray-700 mb-1">Nombre o Mesa *</label>
            <input
              type="text"
              name="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Método de Pago</label>
            <div className="grid grid-cols-3 gap-2">
              {(["CASH", "YAPE", "MIXED"] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 px-2 text-sm rounded-lg ${
                    paymentMethod === method
                      ? "bg-rose-700 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {method === "CASH"
                    ? "Efectivo"
                    : method === "YAPE"
                      ? "Yape"
                      : "Mixto"}
                </button>
              ))}
            </div>
          </div>

          {paymentMethod === "MIXED" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 mb-1">
                  Efectivo (S/)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Yape (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  value={yapeAmount}
                  onChange={(e) => setYapeAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-rose-700 hover:bg-rose-800 text-white py-3 rounded-lg font-bold"
          >
            Confirmar Pago
          </button>
        </form>
      </div>
    </div>
  );
}
