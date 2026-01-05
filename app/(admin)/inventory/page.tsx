// app/(admin)/inventory/page.tsx
import { requireAuth } from "@/utils/session";
import InventoryView from "./InventoryView";
import { getInventoryItems } from "./actions";

export default async function InventoryPage() {
  await requireAuth(["ADMIN", "STAFF"]); // BARISTA may not need this
  const items = await getInventoryItems();
  return <InventoryView initialItems={items} />;
}
