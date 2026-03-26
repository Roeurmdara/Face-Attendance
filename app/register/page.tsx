import Link from "next/link";
import { StudentRegistrationForm } from "@/components/registration/student-registration-form";

export const metadata = {
  title: "Student Registration | Face Attendance",
  description: "Register new students with facial recognition",
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="mx-auto max-w-6xl">

        {/* Home Button */}
        <div className="mb-4">
          <Link href="/">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
              Back to Home
            </button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            Student Registration
          </h1>

          <p className="mt-2 text-gray-600">
            Register new students with facial recognition
          </p>
        </div>

        {/* Form container (important fix) */}
        <div className="max-w-3xl mx-auto">
          <StudentRegistrationForm />
        </div>

      </div>
    </main>
  );
}