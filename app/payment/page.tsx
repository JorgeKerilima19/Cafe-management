// app/payment/page.tsx
export default function PaymentPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // In real app, decode order from searchParams
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Opciones de Pago
        </h1>
        <p className="text-gray-600 mb-6">
          Pronto podrás pagar con efectivo, Yape o mixto.
        </p>
        <div className="space-y-3">
          <button className="w-full bg-rose-700 hover:bg-rose-800 text-white py-2 rounded">
            Pagar con Efectivo
          </button>
          <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded">
            Pagar con Yape
          </button>
          <button className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded">
            Pago Mixto
          </button>
        </div>
      </div>
    </div>
  );
}
