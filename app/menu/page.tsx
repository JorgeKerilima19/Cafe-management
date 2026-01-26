// app/menu/page.tsx
import { prisma } from "@/lib/prisma";
import MenuView from "./MenuView";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const [items, categoryData] = await Promise.all([
    prisma.menuItem.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    prisma.menuItem.groupBy({
      by: ["category"],
      where: { isActive: true },
      orderBy: { category: "asc" },
    }),
  ]);

  const categories = categoryData.map((c) => c.category);
  return <MenuView initialItems={items} categories={categories} />;
}
