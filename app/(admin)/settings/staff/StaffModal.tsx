// app/(admin)/settings/staff/StaffModal.tsx
"use client";

import { updateStaff, deleteStaff } from "./actions";
import { useActionState } from "react";
import { useState } from "react";

export default function StaffModal({
  staff,
  onClose,
}: {
  staff: {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  };
  onClose: () => void;
}) {
  const [updateState, updateAction] = useActionState(updateStaff, null);
  const [deleteState, deleteAction] = useActionState(deleteStaff, null);
  const [activeTab, setActiveTab] = useState<"edit" | "delete">("edit");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-medium text-gray-800">Editar Personal</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          {/* Tabs */}
          <div className="flex border-b mb-4">
            <button
              className={`px-3 py-2 text-sm font-medium ${
                activeTab === "edit"
                  ? "text-rose-700 border-b-2 border-rose-700"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveTab("edit")}
            >
              Editar
            </button>
            <button
              className={`px-3 py-2 text-sm font-medium ${
                activeTab === "delete"
                  ? "text-rose-700 border-b-2 border-rose-700"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveTab("delete")}
            >
              Eliminar
            </button>
          </div>

          {/* Edit Form */}
          {activeTab === "edit" && (
            <form action={updateAction} className="space-y-3">
              <input type="hidden" name="id" value={staff.id} />

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  name="name"
                  defaultValue={staff.name}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-800"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Correo *
                </label>
                <input
                  name="email"
                  type="email"
                  defaultValue={staff.email}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-800"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Nueva contraseña (opcional)
                </label>
                <input
                  name="newPassword"
                  type="password"
                  minLength={6}
                  placeholder="Dejar vacío"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Rol
                  </label>
                  <select
                    name="role"
                    defaultValue={staff.role}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-gray-800"
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
                      defaultChecked={staff.isActive}
                      id={`modal-isActive-${staff.id}`}
                      className="mr-2"
                    />
                    <label
                      htmlFor={`modal-isActive-${staff.id}`}
                      className="text-sm text-gray-700"
                    >
                      Activo
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Contraseña maestra (123456) *
                </label>
                <input
                  name="masterPassword"
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-800"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-rose-700 hover:bg-rose-800 text-white py-2 rounded"
              >
                Actualizar
              </button>

              {updateState?.error && (
                <div className="text-red-600 text-sm mt-2">
                  {updateState.error}
                </div>
              )}
              {updateState?.success && (
                <div className="text-green-600 text-sm mt-2">¡Actualizado!</div>
              )}
            </form>
          )}

          {/* Delete Form */}
          {activeTab === "delete" && (
            <form action={deleteAction} className="space-y-3">
              <input type="hidden" name="id" value={staff.id} />
              <p className="text-gray-700 mb-3">
                ¿Eliminar permanentemente a{" "}
                <span className="font-medium">{staff.name}</span>?
              </p>
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Contraseña maestra (123456) *
                </label>
                <input
                  name="masterPassword"
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-800"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded"
              >
                Eliminar Cuenta
              </button>

              {deleteState?.error && (
                <div className="text-red-600 text-sm mt-2">
                  {deleteState.error}
                </div>
              )}
              {deleteState?.success && (
                <div className="text-green-600 text-sm mt-2">¡Eliminado!</div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
