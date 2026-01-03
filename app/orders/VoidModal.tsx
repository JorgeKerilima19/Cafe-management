// app/(admin)/order/VoidModal.tsx
"use client";

import { useState } from "react";
import { voidOrder } from "./actions";
import { useActionState } from "react";

export default function VoidModal({
  orderId,
  onClose,
}: {
  orderId: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [state, formAction] = useActionState(
    async (_: any, formData: FormData) => {
      const result = await voidOrder(formData);
      if (result?.success) onClose();
      return result;
    },
    null
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Anular Pedido</h2>
        <form action={formAction}>
          <input type="hidden" name="orderId" value={orderId} />
          <label className="block text-sm text-gray-700 mb-2">
            Razón de anulación *
          </label>
          <textarea
            name="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-gray-800"
            rows={3}
            required
          />
          {state?.error && (
            <p className="text-red-600 text-sm mt-2">{state.error}</p>
          )}
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Anular
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
