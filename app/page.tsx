// app/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/utils/session";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "ADMIN") {
    redirect("/dashboard");
  }

  redirect("/order");
}
