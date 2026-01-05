// app/(admin)/ResponsiveSidebar.tsx
"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";

type User = { name: string; role: string };
type NavItem = { name: string; href: string };

export default function ResponsiveSidebar({
  user,
  navItems,
  logoutAction,
  children,
}: {
  user: User;
  navItems: NavItem[];
  logoutAction: () => void;
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static z-30 w-64 h-screen bg-white shadow-md transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
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
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="absolute bottom-0 w-64 p-4 border-t">
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full text-left px-4 py-2 text-gray-600 hover:text-rose-700"
              onClick={() => setSidebarOpen(false)}
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-0">
        {/* Top bar (mobile only) */}
        <div className="lg:hidden bg-white shadow-sm p-4 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
              aria-label="Open menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-gray-800">Cafetería</h1>
            <div className="w-6" />
          </div>
        </div>

        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
