// app/(admin)/dashboard/close/CloseSummary.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type CloseData = {
  openingAmount: number;
  closingAmount: number;
  totalCash: number;
  totalYape: number;
  totalSales: number;
  voidLoss: number;
  netBalance: number;
  expectedCash: number;
};

// ✅ Helper to safely parse and validate data
function parseCloseData(raw: string): CloseData | null {
  try {
    const data = JSON.parse(decodeURIComponent(raw));
    // Validate all required numbers
    if (
      typeof data.openingAmount === "number" &&
      typeof data.closingAmount === "number" &&
      typeof data.totalCash === "number" &&
      typeof data.totalYape === "number" &&
      typeof data.totalSales === "number" &&
      typeof data.voidLoss === "number" &&
      typeof data.netBalance === "number" &&
      typeof data.expectedCash === "number"
    ) {
      return data;
    }
  } catch (e) {
    console.error("Invalid close data");
  }
  return null;
}

export default function CloseSummary() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<CloseData | null>(null);

  useEffect(() => {
    const dataParam = searchParams.get("data");
    if (dataParam) {
      setData(parseCloseData(dataParam));
    }
  }, [searchParams]);

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-gray-600 text-center">
          Cargando resumen de cierre...
        </p>
      </div>
    );
  }

  // ✅ Safe to use .toFixed() now
  const {
    openingAmount,
    closingAmount,
    totalCash,
    totalYape,
    totalSales,
    voidLoss,
    netBalance,
    expectedCash,
  } = data;
  const cashPercentage = totalSales > 0 ? (totalCash / totalSales) * 100 : 0;
  const yapePercentage = totalSales > 0 ? (totalYape / totalSales) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Resumen de Cierre de Caja
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-bold mb-4">Montos de Caja</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Monto Inicial:</span>
              <span className="font-bold text-green-800">
                S/ {openingAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Monto Final:</span>
              <span className="font-bold text-blue-800">
                S/ {closingAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Efectivo Esperado:</span>
              <span className="font-bold text-purple-800">
                S/ {expectedCash.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t">
              <span className="font-bold">Diferencia:</span>
              <span
                className={`font-bold ${
                  closingAmount === expectedCash
                    ? "text-green-800"
                    : closingAmount > expectedCash
                    ? "text-blue-800"
                    : "text-red-800"
                }`}
              >
                S/ {(closingAmount - expectedCash).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-bold mb-4">Ventas y Pérdidas</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Ventas:</span>
              <span className="font-bold text-gray-800">
                S/ {totalSales.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Anulaciones (Pérdida):</span>
              <span className="font-bold text-red-800">
                - S/ {voidLoss.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t">
              <span className="font-bold">Balance Neto:</span>
              <span className="font-bold text-rose-700">
                S/ {netBalance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
        <h2 className="text-lg font-bold mb-4 text-center">
          Desglose por Método de Pago
        </h2>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-1">
              <span className="font-medium">Efectivo</span>
              <span className="text-green-800">
                S/ {totalCash.toFixed(2)} ({cashPercentage.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full"
                style={{ width: `${Math.min(cashPercentage, 100)}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="font-medium">Yape</span>
              <span className="text-purple-800">
                S/ {totalYape.toFixed(2)} ({yapePercentage.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-purple-600 h-3 rounded-full"
                style={{ width: `${Math.min(yapePercentage, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-rose-700 text-white rounded-lg hover:bg-rose-800 inline-block"
        >
          Volver al Panel
        </Link>
      </div>
    </div>
  );
}
