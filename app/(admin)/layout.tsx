// app/(admin)/layout.tsx
import { getCurrentUser } from "@/utils/session";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions";
import ResponsiveSidebar from "./ResponsiveSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Nav items by role
  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      allowed: ["ADMIN"],
    },
    {
      name: "Pedidos",
      href: "/orders",
      allowed: ["ADMIN", "BARISTA", "STAFF"],
    },
    {
      name: "Cancelaciones",
      href: "/settings/void-records",
      allowed: ["ADMIN"],
    },
    {
      name: "Inventario",
      href: "/inventory",
      allowed: ["ADMIN"],
    },
    {
      name: "Reportes",
      href: "/settings/reports",
      allowed: ["ADMIN"],
    },
    { name: "Ajustes", href: "/settings", allowed: ["ADMIN"] },
  ].filter((item) => item.allowed.includes(user.role));

  return (
    <ResponsiveSidebar 
      user={user} 
      navItems={navItems} 
      logoutAction={logout}
    >
      {children}
    </ResponsiveSidebar>
  );
}