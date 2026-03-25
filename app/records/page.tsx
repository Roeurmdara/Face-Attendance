import { AttendanceRecords } from "@/components/records/attendance-records";

export const metadata = {
  title: "Attendance Records | Face Attendance",
  description: "View and manage attendance records",
};

export default function RecordsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            Attendance Records
          </h1>
          <p className="mt-2 text-gray-600">
            View and manage student attendance history
          </p>
        </div>

        <AttendanceRecords />
      </div>
    </main>
  );
}
