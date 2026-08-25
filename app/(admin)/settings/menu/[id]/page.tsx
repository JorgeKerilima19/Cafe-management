import { requireAdmin } from "@/utils/session";
import { prisma } from "@/lib/prisma";
import CreateMenuItemForm from "../CreateMenuItemForm";
import RecipeEditor from "../RecipeEditor";
import Link from "next/link";

export default async function EditMenuItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin();

  if (!id) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <p className="text-red-600">ID de item no proporcionado.</p>
        <Link
          href="/settings/menu"
          className="text-rose-700 hover:underline mt-4 inline-block"
        >
          ← Volver al menú
        </Link>
      </div>
    );
  }

  const item = await prisma.menuItem.findUnique({
    where: { id },
    include: {
      recipe: {
        include: {
          ingredients: {
            include: {
              inventoryItem: {
                select: { name: true, unit: true },
              },
            },
          },
        },
      },
    },
  });

  if (!item) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <p className="text-gray-600">Item no encontrado.</p>
        <Link
          href="/settings/menu"
          className="text-rose-700 hover:underline mt-4 inline-block"
        >
          ← Volver al menú
        </Link>
      </div>
    );
  }

  const categoryData = await prisma.menuItem.groupBy({
    by: ["category"],
    orderBy: { category: "asc" },
  });
  const existingCategories = categoryData.map((c) => c.category);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <Link
          href="/settings/menu"
          className="text-rose-700 hover:underline text-sm"
        >
          ← Volver al menú
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-800">
        Editar Item: {item.name}
      </h1>

      {item.imageUrl && (
        <div className="text-center">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="mx-auto h-48 object-cover rounded-lg border"
          />
        </div>
      )}

      <CreateMenuItemForm
        item={item}
        existingCategories={existingCategories}
        isEditPage={true}
      />

      {/* Recipe Editor (only on edit page) */}
      <RecipeEditor
        menuItemId={item.id}
        initialIngredients={item.recipe?.ingredients || []}
      />
    </div>
  );
}
