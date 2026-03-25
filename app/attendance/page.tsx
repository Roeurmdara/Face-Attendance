import { LiveAttendanceForm } from "@/components/attendance/live-attendance-form";

export const metadata = {
  title: "Mark Attendance | Face Attendance",
  description: "Real-time face recognition attendance",
};

export default function AttendancePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">Mark Attendance</h1>
          <p className="mt-2 text-gray-600">
            Real-time face recognition attendance system
          </p>
        </div>

        <LiveAttendanceForm />
      </div>
    </main>
  );
}
