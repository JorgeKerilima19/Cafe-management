// app/(admin)/settings/menu/CreateMenuItemForm.tsx
"use client";

import { createMenuItem, updateMenuItem } from "./actions";
import { useFormState } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateMenuItemForm({
  item = null,
  existingCategories = [],
  isEditPage = false,
}: {
  item?: any;
  existingCategories?: string[];
  isEditPage?: boolean;
}) {
  const isEdit = !!item;
  const router = useRouter();
  const [imagePreview, setImagePreview] = useState<string | null>(
    item?.imageUrl || null
  );
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, formAction] = useFormState(
    isEdit ? updateMenuItem : createMenuItem,
    null
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageBase64(reader.result as string);
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Redirect on success (for create)
  useEffect(() => {
    if (state?.success && !isEdit) {
      router.refresh(); // refresh list page
    }
  }, [state, isEdit, router]);

  return (
    <form
      action={formAction}
      className="space-y-4 bg-white p-4 rounded-md border"
    >
      {/* Hidden ID for update */}
      {isEdit && <input type="hidden" name="id" value={item.id} />}

      {/* Name */}
      <div>
        <label className="block text-sm text-gray-700 mb-1">Nombre *</label>
        <input
          name="name"
          defaultValue={item?.name || ""}
          className="w-full px-3 py-2 border border-gray-300 rounded text-gray-800"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm text-gray-700 mb-1">Descripción</label>
        <textarea
          name="description"
          defaultValue={item?.description || ""}
          className="w-full px-3 py-2 border border-gray-300 rounded text-gray-800"
          rows={3}
        />
      </div>

      {/* Price & Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Precio (S/) *
          </label>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={item?.price || ""}
            className="w-full px-3 py-2 border border-gray-300 rounded text-gray-800"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Categoría</label>
          <input
            name="category"
            list="categories"
            defaultValue={item?.category || "General"}
            className="w-full px-3 py-2 border border-gray-300 rounded text-gray-800"
          />
          <datalist id="categories">
            {existingCategories.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </div>
      </div>

      {/* Image */}
      <div>
        <label className="block text-sm text-gray-700 mb-1">Imagen</label>
        {imagePreview && (
          <div className="mb-2">
            <img
              src={imagePreview}
              alt="Preview"
              className="h-32 object-cover rounded border"
            />
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="text-sm text-gray-800 border-2 border-rose-700"
        />
        {imageBase64 && (
          <input type="hidden" name="imageBase64" value={imageBase64} />
        )}
      </div>

      {/* Active */}
      <div className="flex items-center">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={item?.isActive ?? true}
          id="isActive"
          className="mr-2"
        />
        <label htmlFor="isActive" className="text-sm text-gray-700">
          Activo (visible en el menú público)
        </label>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full bg-rose-700 hover:bg-rose-800 text-white py-2 px-4 rounded-md"
      >
        {isEdit ? "Actualizar Item" : "Agregar al Menú"}
      </button>

      {/* Feedback */}
      {state?.error && (
        <div className="text-red-600 text-sm mt-2">{state.error}</div>
      )}
      {state?.success && (
        <div className="text-green-600 text-sm mt-2">
          {isEdit ? "¡Item actualizado!" : "¡Item agregado!"}
        </div>
      )}

      {/* Back button on edit page */}
      {isEditPage && (
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            ← Cancelar
          </button>
        </div>
      )}
    </form>
  );
}
