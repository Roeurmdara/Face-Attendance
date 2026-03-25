import { StudentManagement } from "@/components/admin/student-management";

export const metadata = {
  title: "Admin Dashboard | Face Attendance",
  description: "Manage students and system settings",
};

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-50 py-8 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage students and system settings
          </p>
        </div>

        <StudentManagement />
      </div>
    </main>
  );
}
