// app/menu/thank-you/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ThankYouPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/menu");
    }, 3000); // 3 seconds

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-green-800 mb-2">
          ¡Pedido Confirmado!
        </h1>
        <p className="text-green-700 mb-4">
          Gracias por tu compra. Serás redirigido al menú en 3 segundos...
        </p>
        <Link
          href="/menu"
          className="text-rose-700 hover:text-rose-800 font-medium"
        >
          ← Volver al menú ahora
        </Link>
      </div>
    </div>
  );
}
