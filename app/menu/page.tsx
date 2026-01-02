// app/menu/page.tsx
import { prisma } from '@/lib/prisma';
import MenuClient from './MenuClient';

export default async function MenuPage() {
  // Fetch active menu items and categories on the server
  const [items, categoryData] = await Promise.all([
    prisma.menuItem.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    }),
    prisma.menuItem.groupBy({
      by: ['category'],
      where: { isActive: true },
      orderBy: { category: 'asc' },
    }),
  ]);

  const categories = categoryData.map(c => c.category);

  // Pass data to client component
  return <MenuClient initialItems={items} categories={categories} />;
}