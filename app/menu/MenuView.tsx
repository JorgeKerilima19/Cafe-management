// app/menu/MenuView.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  imageUrl: string | null;
};

export default function MenuView({
  initialItems,
  categories,
}: {
  initialItems: MenuItem[];
  categories: string[];
}) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<Array<MenuItem & { quantity: number }>>([]);

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
  const safeCart = cart.map(({ id, name, price, quantity }) => ({
    id,
    name,
    price,
    quantity,
  }));

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

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const proceedToCheckout = () => {
    if (total === 0) return;
    const encoded = btoa(JSON.stringify({ items: safeCart, total }));
    router.push(`/menu/checkout?cart=${encoded}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Menú</h1>
          <Link href="/" className="text-rose-700 hover:text-rose-800 text-sm">
            ← Inicio
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
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
            <p className="text-gray-600">No hay items.</p>
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
                      className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row gap-10"
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-32 w-32 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="h-32 w-32 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-500 text-sm text-center px-2">
                            Sin imagen
                          </span>
                        </div>
                      )}
                      <div className="flex-1 flex flex-col justify-between gap-6">
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
                          className="mt-4 sm:mt-0 bg-rose-700 hover:bg-rose-800 text-white px-4 py-2 rounded-lg font-medium"
                        >
                          Agregar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="lg:w-1/4">
          <div className="bg-white rounded-xl shadow-sm p-4 sticky top-24">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Tu Pedido</h2>
            {cart.length === 0 ? (
              <p className="text-gray-600">Agrega items.</p>
            ) : (
              <>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center"
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        <p className="text-xs text-gray-600">
                          x{item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => decreaseQty(item.id)}
                          className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 text-sm"
                        >
                          −
                        </button>
                        <span className="font-medium text-rose-700 text-sm">
                          S/ {(item.price * item.quantity).toFixed(2)}
                        </span>
                        <button
                          onClick={() => increaseQty(item.id)}
                          className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 text-sm"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-rose-700">S/ {total.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={proceedToCheckout}
                    disabled={total === 0}
                    className={`w-full mt-4 py-2.5 rounded-lg font-bold ${
                      total === 0
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-rose-700 hover:bg-rose-800 text-white"
                    }`}
                  >
                    Proceder al Pago
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
