import { StudentRegistrationForm } from "@/components/registration/student-registration-form";

export const metadata = {
  title: "Student Registration | Face Attendance",
  description: "Register new students with facial recognition",
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            Student Registration
          </h1>
          <p className="mt-2 text-gray-600">
            Register new students with facial recognition
          </p>
        </div>

        <StudentRegistrationForm />
      </div>
    </main>
  );
}
