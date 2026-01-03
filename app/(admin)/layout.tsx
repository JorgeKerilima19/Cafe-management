// app/(admin)/layout.tsx
import { getCurrentUser } from "@/utils/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { logout } from "@/app/actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Nav items by role
  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      allowed: ["ADMIN"],
    },
    {
      name: "Pedidos",
      href: "/orders",
      allowed: ["ADMIN", "BARISTA", "STAFF"],
    },
    {
      name: "Cancelaciones",
      href: "/settings/void-records",
      allowed: ["ADMIN"],
    },
    {
      name: "Reportes",
      href: "/settings/reports",
      allowed: ["ADMIN"],
    },
    { name: "Ajustes", href: "/settings", allowed: ["ADMIN"] },
  ].filter((item) => item.allowed.includes(user.role));

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800">Cafetería</h1>
          <p className="text-sm text-gray-600">
            {user.name} ({user.role})
          </p>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block px-4 py-2 text-gray-700 rounded-md hover:bg-rose-50 hover:text-rose-700 transition"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="absolute bottom-0 w-64 p-4 border-t">
          <form action={logout}>
            <button
              type="submit"
              className="w-full text-left px-4 py-2 text-gray-600 hover:text-rose-700"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
