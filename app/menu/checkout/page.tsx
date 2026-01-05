// app/menu/checkout/page.tsx
import { Suspense } from "react";
import CheckoutClient from "./CheckoutClient";

// ✅ Disable static rendering for this page
export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          Cargando...
        </div>
      }
    >
      <CheckoutClient />
    </Suspense>
  );
}
