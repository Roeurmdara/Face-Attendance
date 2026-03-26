import Link from "next/link";
import { Home } from "lucide-react";
import { LiveAttendanceForm } from "@/components/attendance/live-attendance-form";

export const metadata = {
  title: "Mark Attendance | Face Attendance",
  description: "Real-time face recognition attendance",
};

export default function AttendancePage() {
  return (
    <main className="min-h-screen  bg-slate-50 py-8 px-4">
      <div className="mx-auto max-w-6xl">

        {/* Home Button */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
          >
            <Home size={18} />
            ​Back to Home​
          </Link>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            Mark Attendance
          </h1>

          <p className="mt-2 text-gray-600">
            Real-time face recognition attendance system
          </p>
        </div>

        <LiveAttendanceForm />

      </div>
    </main>
  );
}