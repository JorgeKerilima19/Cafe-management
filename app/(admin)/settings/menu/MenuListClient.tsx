// app/(admin)/settings/menu/MenuListClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteMenuItem } from "./actions";

export default function MenuListClient({
  initialItems,
  initialCategories,
}: {
  initialItems: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string;
    imageUrl: string | null;
    isActive: boolean;
  }[];
  initialCategories: string[];
}) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredItems = initialItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory
      ? item.category === selectedCategory
      : true;
    return matchesSearch && matchesCategory;
  });

  const categoriesToShow = Array.from(
    new Set(filteredItems.map((i) => i.category))
  );
  const itemsByCategory = categoriesToShow.reduce((acc, cat) => {
    acc[cat] = filteredItems.filter((item) => item.category === cat);
    return acc;
  }, {} as Record<string, typeof initialItems>);

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-gray-800 text-sm"
          />
        </div>
        <div>
          <select
            value={selectedCategory || ""}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded text-gray-800 text-sm"
          >
            <option value="">Todas las categorías</option>
            {initialCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <p className="text-gray-600">No se encontraron items.</p>
      ) : (
        categoriesToShow.map((category) => (
          <div key={category} className="mb-6">
            <h3 className="text-md font-medium text-gray-700 mb-2 bg-gray-50 p-2 rounded flex justify-between">
              <span>{category}</span>
              <span className="text-sm text-gray-500">
                {itemsByCategory[category].length} items
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {itemsByCategory[category].map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-md border">
                  <div className="flex items-start gap-3">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-16 w-16 object-cover rounded"
                      />
                    ) : (
                      <div className="h-16 w-16 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-sm">
                        Sin imagen
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-800 truncate">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        S/ {item.price.toFixed(2)}
                      </p>
                      {!item.isActive && (
                        <span className="inline-block mt-1 text-xs bg-rose-100 text-rose-800 px-2 py-1 rounded">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/settings/menu/${item.id}`}
                        className="text-xs text-blue-600 hover:text-blue-800 whitespace-nowrap"
                      >
                        Editar
                      </Link>
                      <form action={deleteMenuItem}>
                        <input type="hidden" name="id" value={item.id} />
                        <button
                          type="submit"
                          className="text-xs text-red-600 hover:text-red-800 whitespace-nowrap"
                        >
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </>
  );
}
