// app/(admin)/settings/page.tsx
import { requireAdmin } from "@/utils/session";
import Link from "next/link";

export default async function SettingsPage() {
  await requireAdmin();

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Configuración</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Menu Management Card */}
        <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Menú</h2>
          <p className="text-gray-600 text-sm mb-4">
            Agrega, edita o elimina items del menú diario.
          </p>
          <Link
            href="/settings/menu"
            className="inline-block px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-sm font-medium rounded-md transition"
          >
            Gestionar menú
          </Link>
        </div>

        {/* Staff Management Card */}
        <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Personal</h2>
          <p className="text-gray-600 text-sm mb-4">
            Administra cuentas de staff, roles y permisos.
          </p>
          <Link
            href="/users"
            className="inline-block px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-sm font-medium rounded-md transition"
          >
            Gestionar personal
          </Link>
        </div>

        {/* Reports Card */}
        <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Reportes</h2>
          <p className="text-gray-600 text-sm mb-4">
            Ver ventas diarias, items más vendidos y métodos de pago.
          </p>
          <Link
            href="/reports"
            className="inline-block px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-sm font-medium rounded-md transition"
          >
            Ver reportes
          </Link>
        </div>

        {/* System Settings (future) */}
        <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Sistema</h2>
          <p className="text-gray-600 text-sm mb-4">
            Configura Yape, horarios, y modo de operación.
          </p>
          <span className="inline-block px-4 py-2 bg-gray-300 text-gray-500 text-sm font-medium rounded-md cursor-not-allowed">
            Próximamente
          </span>
        </div>
      </div>
    </div>
  );
}
