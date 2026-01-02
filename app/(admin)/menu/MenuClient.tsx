"use client";
import Link from "next/link";

import { useState } from "react";

export function MenuClient({
  items,
  categories,
}: {
  items: any[];
  categories: string[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredItems = selectedCategory
    ? items.filter((item) => item.category === selectedCategory)
    : items;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Menú
      </h1>

      {/* Category Filters */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            selectedCategory === null
              ? "bg-rose-700 text-white"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
        >
          Todos ({items.length})
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              selectedCategory === category
                ? "bg-rose-700 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Menu Items */}
      {filteredItems.length === 0 ? (
        <p className="text-center text-gray-600">
          No hay items en esta categoría.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow p-4 border"
            >
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-32 object-cover rounded mb-3"
                />
              )}
              <h3 className="font-semibold text-gray-800">{item.name}</h3>
              {item.description && (
                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
              )}
              <p className="text-lg font-bold text-rose-700">
                S/ {item.price.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="text-center mt-8">
        <Link
          href="/"
          className="inline-block bg-rose-700 hover:bg-rose-800 text-white px-6 py-2 rounded-md"
        >
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}
