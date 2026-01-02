// app/(admin)/settings/menu/page.tsx
import { requireAdmin } from "@/utils/session";
import { prisma } from "@/lib/prisma";
import CreateMenuItemForm from "./CreateMenuItemForm";
import MenuListClient from "./MenuListClient";

export default async function MenuSettingsPage() {
  await requireAdmin();

  const [items, categoryCounts] = await Promise.all([
    prisma.menuItem.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    prisma.menuItem.groupBy({
      by: ["category"],
      _count: { _all: true },
      orderBy: { category: "asc" },
    }),
  ]);

  const categories = categoryCounts.map((c) => c.category);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Menú</h1>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Agregar Nuevo Item
        </h2>
        <CreateMenuItemForm existingCategories={categories} />
      </div>

      <MenuListClient initialItems={items} initialCategories={categories} />
    </div>
  );
}
