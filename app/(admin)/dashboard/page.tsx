// app/(admin)/dashboard/page.tsx
import { requireAuth } from "@/utils/session";
import DashboardView from "./DashboardView";
import { getDashboardData } from "./actions";

export default async function DashboardPage() {
  await requireAuth(["ADMIN", "BARISTA", "STAFF"]);
  const data = await getDashboardData();
  return <DashboardView initialData={data} />;
}
