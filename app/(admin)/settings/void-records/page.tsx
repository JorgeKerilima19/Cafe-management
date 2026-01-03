// app/(admin)/settings/void-records/page.tsx
import { requireAdmin } from "@/utils/session";
import VoidRecordsView from "./VoidRecordsView";

export default async function VoidRecordsPage() {
  await requireAdmin();
  return <VoidRecordsView />;
}
