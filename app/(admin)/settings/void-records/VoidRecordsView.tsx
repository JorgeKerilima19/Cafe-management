// app/(admin)/settings/void-records/VoidRecordsView.tsx
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { getVoidRecords } from "./actions";

// ✅ Fix: voidedAt is a Date (Prisma returns Date, not string)
type VoidRecord = {
  id: string;
  amount: number;
  reason: string;
  voidedAt: Date; // ← was string, now Date
  voidedBy: { name: string } | null;
};

export default function VoidRecordsView() {
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [voidData, setVoidData] = useState<{
    voids: VoidRecord[];
    totalAmount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchVoids = async (date: string) => {
    setLoading(true);
    const result = await getVoidRecords(date);

    // ✅ Optional: Convert voidedAt to Date if needed (Prisma already does this)
    // But your action returns plain objects — ensure they're Dates
    setVoidData({
      voids: result.voids.map((v) => ({
        ...v,
        voidedAt: new Date(v.voidedAt), // Ensure it's a Date
      })),
      totalAmount: result.totalAmount,
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchVoids(selectedDate);
  }, [selectedDate]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Registros de Anulaciones
      </h1>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
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

      {voidData && (
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            {format(new Date(selectedDate), "dd/MM/yyyy")}
          </h2>
          <p className="text-red-600 font-bold">
            Total anulado: S/ {voidData.totalAmount.toFixed(2)}
          </p>
        </div>
      )}

      {loading ? (
        <p className="text-gray-600">Cargando...</p>
      ) : voidData?.voids.length === 0 ? (
        <p className="text-gray-600">No hay anulaciones en esta fecha.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                  Hora
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                  Monto
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                  Anulado por
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                  Razón
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {voidData!.voids.map((voidRecord: any) => (
                <tr key={voidRecord.id}>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {/* ✅ Format Date to string for display */}
                    {format(voidRecord.voidedAt, "HH:mm")}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-red-600">
                    S/ {voidRecord.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {voidRecord.voidedBy?.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {voidRecord.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
