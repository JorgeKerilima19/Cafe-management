// app/(admin)/settings/reports/page.tsx
import { requireAdmin } from "@/utils/session";
import ReportsView from "./ReportsView";

export default async function ReportsPage() {
  await requireAdmin();
  return <ReportsView />;
}
