// app/(admin)/dashboard/close/page.tsx
import { getCurrentUser } from "@/utils/session";
import { redirect } from "next/navigation";
import CloseSummary from "./CloseSummary";

export default async function ClosePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <CloseSummary />;
}
