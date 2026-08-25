"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { saveRecipe, getInventoryItemsForRecipe } from "./actions";

type InventoryItem = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
};

type RecipeIngredient = {
  id: string;
  inventoryItemId: string;
  quantityRequired: number;
  inventoryItem: {
    name: string;
    unit: string;
  };
};

export default function RecipeEditor({
  menuItemId,
  initialIngredients = [],
}: {
  menuItemId: string;
  initialIngredients?: RecipeIngredient[];
}) {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [ingredients, setIngredients] = useState<
    Array<{ inventoryItemId: string; quantityRequired: string }>
  >(
    initialIngredients.map((ing) => ({
      inventoryItemId: ing.inventoryItemId,
      quantityRequired: ing.quantityRequired.toString(),
    })),
  );
  const [isOpen, setIsOpen] = useState(initialIngredients.length > 0);
  const [state, formAction] = useActionState(saveRecipe, null);

  // Load inventory items when editor opens
  useEffect(() => {
    if (isOpen && inventoryItems.length === 0) {
      getInventoryItemsForRecipe().then(setInventoryItems);
    }
  }, [isOpen]);

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { inventoryItemId: "", quantityRequired: "" },
    ]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (
    index: number,
    field: "inventoryItemId" | "quantityRequired",
    value: string,
  ) => {
    setIngredients(
      ingredients.map((ing, i) =>
        i === index ? { ...ing, [field]: value } : ing,
      ),
    );
  };

  const getSelectedUnit = (inventoryItemId: string) => {
    const item = inventoryItems.find((i) => i.id === inventoryItemId);
    return item?.unit || "";
  };

  return (
    <div className="border border-amber-200 rounded-lg bg-amber-50/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex justify-between items-center hover:bg-amber-50 transition"
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <span className="font-medium text-gray-800">
            Receta / Ingredientes
          </span>
          {initialIngredients.length > 0 && (
            <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
              {initialIngredients.length} ingrediente
              {initialIngredients.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <form action={formAction} className="p-4 border-t border-amber-200">
          <input type="hidden" name="menuItemId" value={menuItemId} />
          <input
            type="hidden"
            name="ingredients"
            value={JSON.stringify(
              ingredients
                .filter((i) => i.inventoryItemId && i.quantityRequired)
                .map((i) => ({
                  inventoryItemId: i.inventoryItemId,
                  quantityRequired: parseFloat(i.quantityRequired),
                })),
            )}
          />

          <p className="text-sm text-gray-600 mb-3">
            Define los ingredientes que se descuentan del inventario al vender
            este item. La cantidad debe coincidir con la unidad del inventario
            (ej: si el inventario está en <strong>Kg</strong>, escribe{" "}
            <code>0.018</code> para 18 gramos).
          </p>

          {ingredients.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-2">
              Sin ingredientes. Este item no descontará inventario.
            </p>
          ) : (
            <div className="space-y-2 mb-3">
              {ingredients.map((ing, idx) => (
                <div
                  key={idx}
                  className="flex gap-2 items-center bg-white p-2 rounded border border-gray-200"
                >
                  <select
                    value={ing.inventoryItemId}
                    onChange={(e) =>
                      updateIngredient(idx, "inventoryItemId", e.target.value)
                    }
                    className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded text-gray-800"
                    required
                  >
                    <option value="">Seleccionar inventario...</option>
                    {inventoryItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} (Stock: {item.quantity} {item.unit})
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={ing.quantityRequired}
                      onChange={(e) =>
                        updateIngredient(
                          idx,
                          "quantityRequired",
                          e.target.value,
                        )
                      }
                      className="w-24 px-2 py-1.5 text-sm border border-gray-300 rounded text-gray-800"
                      placeholder="Cantidad"
                      required
                    />
                    <span className="text-xs text-gray-500 w-12">
                      {getSelectedUnit(ing.inventoryItemId)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeIngredient(idx)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    aria-label="Eliminar"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={addIngredient}
              className="px-3 py-1.5 text-sm bg-amber-100 text-amber-800 rounded hover:bg-amber-200 flex items-center gap-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Agregar ingrediente
            </button>

            <button
              type="submit"
              className="ml-auto px-4 py-1.5 text-sm bg-amber-600 text-white rounded hover:bg-amber-700"
            >
              Guardar receta
            </button>
          </div>

          {state?.error && (
            <p className="text-red-600 text-sm mt-2">{state.error}</p>
          )}
          {state?.success && (
            <p className="text-green-600 text-sm mt-2">
              ✅ Receta guardada exitosamente
            </p>
          )}
        </form>
      )}
    </div>
  );
}
