// app/menu/MenuClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  imageUrl: string | null;
};

export default function MenuClient({
  initialItems,
  categories,
}: {
  initialItems: MenuItem[];
  categories: string[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<Array<MenuItem & { quantity: number }>>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const filteredItems = selectedCategory
    ? initialItems.filter((item) => item.category === selectedCategory)
    : initialItems;

  const categoriesToShow = Array.from(
    new Set(filteredItems.map((i) => i.category))
  );
  const itemsByCategory = categoriesToShow.reduce((acc, cat) => {
    acc[cat] = filteredItems.filter((item) => item.category === cat);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const increaseQty = (id: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQty = (id: string) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id && item.quantity > 1
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Menú</h1>
          <Link href="/" className="text-rose-700 hover:text-rose-800 text-sm">
            ← Inicio
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        {/* Menu Items */}
        <div className="lg:w-3/4">
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                selectedCategory === null
                  ? "bg-rose-700 text-white"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  selectedCategory === cat
                    ? "bg-rose-700 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {categoriesToShow.length === 0 ? (
            <p className="text-gray-600">No hay items en esta categoría.</p>
          ) : (
            categoriesToShow.map((category) => (
              <div key={category} className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  {category}
                </h2>
                <div className="space-y-4">
                  {itemsByCategory[category].map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row gap-4 items-center justify-center"
                    >
                      {/* Larger Image */}
                      <div className="shrink-0 h-full w-32 flex items-center justify-center">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-full w-full object-fill rounded-lg"
                          />
                        ) : (
                          <div className="h-32 w-32 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-500 text-sm text-center px-2">
                              Sin imagen
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info & Action */}
                      <div className="flex-1 flex flex-col justify-between gap-8">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">
                            {item.name}
                          </h3>
                          {item.description && (
                            <p className="text-gray-600 mt-1">
                              {item.description}
                            </p>
                          )}
                          <p className="text-xl font-bold text-rose-700 mt-2">
                            S/ {item.price.toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={() => addToCart(item)}
                          className="mt-2 sm:mt-0 bg-rose-700 hover:bg-rose-800 text-white px-4 py-2 rounded-lg font-medium"
                        >
                          Agregar al pedido
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Simplified Cart */}
        <div className="lg:w-1/4">
          <div className="bg-white rounded-xl shadow-sm p-4 sticky top-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Tu Pedido</h2>

            {cart.length === 0 ? (
              <p className="text-gray-600">Agrega items para continuar.</p>
            ) : (
              <>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">
                          x{item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => decreaseQty(item.id)}
                          className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 text-lg"
                        >
                          −
                        </button>
                        <span className="font-medium text-rose-700">
                          S/ {(item.price * item.quantity).toFixed(2)}
                        </span>
                        <button
                          onClick={() => increaseQty(item.id)}
                          className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 text-lg"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total:</span>
                    <span className="text-rose-700">S/ {total.toFixed(2)}</span>
                  </div>

                  <div className="mt-4 space-y-3">
                    <input
                      type="text"
                      placeholder="Nombre (requerido)"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Teléfono"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800"
                    />
                  </div>

                  <form action="/payment" method="GET" className="mt-6">
                    <input
                      type="hidden"
                      name="items"
                      value={JSON.stringify(cart)}
                    />
                    <input
                      type="hidden"
                      name="total"
                      value={total.toString()}
                    />
                    <input
                      type="hidden"
                      name="customerName"
                      value={customerName}
                    />
                    <input
                      type="hidden"
                      name="customerPhone"
                      value={customerPhone}
                    />
                    <button
                      type="submit"
                      disabled={!customerName.trim() || total === 0}
                      className={`w-full py-3 px-4 rounded-lg font-bold text-white ${
                        !customerName.trim() || total === 0
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-rose-700 hover:bg-rose-800"
                      }`}
                    >
                      Proceder al Pago
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
