// app/(admin)/dashboard/page.tsx
import { requireAuth } from "@/utils/session";

export default async function DashboardPage() {
  const user = await requireAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Dashboard</h1>
      <p className="text-gray-600">
        Bienvenido, <span className="font-medium">{user.name}</span>.
      </p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-800">Pedidos Hoy</h2>
          <p className="text-2xl font-bold text-rose-700">12</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-800">Ventas</h2>
          <p className="text-2xl font-bold text-rose-700">S/ 240.50</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-800">Pendientes</h2>
          <p className="text-2xl font-bold text-rose-700">3</p>
        </div>
      </div>
    </div>
  );
}
