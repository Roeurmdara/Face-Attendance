import { StudentManagement } from "@/components/admin/student-management";
import Link from "next/link";

export const metadata = {
  title: "Admin Dashboard | Face Attendance",
  description: "Manage students and system settings",
};

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-50 py-8 px-4">
      <div className="mx-auto max-w-6xl">

        {/* Home Button */}
        <div className="mb-4">
          <Link href="/">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
              Back to Home
            </button>
          </Link>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            Admin Dashboard
          </h1>

          <p className="mt-2 text-gray-600">
            Manage students and system settings
          </p>
        </div>

        <StudentManagement />

      </div>
    </main>
  );
}