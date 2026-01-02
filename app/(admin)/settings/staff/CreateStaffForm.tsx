// app/(admin)/settings/staff/CreateStaffForm.tsx
"use client";

import { handleStaffAction } from "./actions";
import { useActionState } from "react";
import { useEffect } from "react";

export default function CreateStaffForm({
  staff = null,
}: {
  staff?: {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  } | null;
}) {
  const isEdit = !!staff;
  const [state, formAction] = useActionState(handleStaffAction, null);

  useEffect(() => {
    if (isEdit) {
      const passwordInput = document.querySelector('input[name="password"]');
      if (passwordInput) passwordInput.remove();
    }
  }, [isEdit]);

  return (
    <form
      action={formAction}
      className="bg-white p-4 rounded-md border space-y-3 w-full"
    >
      {/* Action type */}
      <input
        type="hidden"
        name="actionType"
        value={isEdit ? "update" : "create"}
      />
      {isEdit && <input type="hidden" name="id" value={staff.id} />}

      {/* Form fields (same as before) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-700 mb-1">
            Nombre completo *
          </label>
          <input
            name="name"
            defaultValue={staff?.name || ""}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-gray-800"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-700 mb-1">
            Correo electrónico *
          </label>
          <input
            name="email"
            type="email"
            defaultValue={staff?.email || ""}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-gray-800"
            required
          />
        </div>
      </div>

      {!isEdit && (
        <div>
          <label className="block text-xs text-gray-700 mb-1">
            Contraseña *
          </label>
          <input
            name="password"
            type="password"
            minLength={6}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-gray-800"
            required
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-700 mb-1">Rol</label>
          <select
            name="role"
            defaultValue={staff?.role || "STAFF"}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-gray-800"
          >
            <option value="ADMIN">Administrador</option>
            <option value="BARISTA">Barista / Cocina</option>
            <option value="STAFF">Personal</option>
          </select>
        </div>
        <div className="flex items-end">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={staff?.isActive ?? true}
              id={`isActive-${staff?.id || "new"}`}
              className="mr-1"
            />
            <label
              htmlFor={`isActive-${staff?.id || "new"}`}
              className="text-xs text-gray-700"
            >
              Activo
            </label>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 text-xs bg-rose-700 hover:bg-rose-800 text-white py-1.5 rounded"
        >
          {isEdit ? "Actualizar" : "Crear Cuenta"}
        </button>

        {/* Delete Button — NO nested form */}
        {isEdit && (
          <button
            type="button"
            onClick={async () => {
              if (!confirm("¿Eliminar permanentemente esta cuenta?")) return;

              // Create a FormData object manually
              const formData = new FormData();
              formData.append("actionType", "delete");
              formData.append("id", staff.id);

              // Trigger the same action
              formAction(formData);
            }}
            className="text-xs bg-red-600 hover:bg-red-700 text-white py-1.5 px-2 rounded"
          >
            Eliminar
          </button>
        )}
      </div>

      {state?.error && (
        <div className="text-red-600 text-xs mt-1">{state.error}</div>
      )}
      {state?.success && (
        <div className="text-green-600 text-xs mt-1">¡Operación exitosa!</div>
      )}
    </form>
  );
}
