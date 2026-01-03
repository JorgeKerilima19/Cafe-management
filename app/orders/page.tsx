// app/(admin)/order/page.tsx
import { requireAuth } from "@/utils/session";
import OrderDashboard from "./OrderDashboard";
import { getTodaysOrders } from "./actions";

export default async function OrderPage() {
  await requireAuth(["ADMIN", "BARISTA", "STAFF", "SYSTEM"]);
  const initialOrders = await getTodaysOrders();
  return <OrderDashboard initialOrders={initialOrders} />;
}
