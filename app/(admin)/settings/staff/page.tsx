// app/(admin)/settings/staff/page.tsx
import { requireAdmin } from '@/utils/session';
import { prisma } from '@/lib/prisma';
import CreateStaffForm from './CreateStaffForm';
import StaffTableClient from './StaffTableClient';

export default async function StaffSettingsPage() {
  await requireAdmin();

  const staffMembers = await prisma.user.findMany({
    orderBy: { name: 'asc' },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Personal</h1>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Agregar Nuevo Miembro</h2>
        <CreateStaffForm />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Personal Actual</h2>
        <StaffTableClient staffMembers={staffMembers} />
      </div>
    </div>
  );
}