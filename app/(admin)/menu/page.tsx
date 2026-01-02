import { prisma } from "@/lib/prisma";
import { MenuClient } from "./MenuClient";

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

  return <MenuClient items={items} categories={categories} />;
}
