import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Camera,
  Users,
  BarChart3,
  Settings,
  ArrowRight,
} from "lucide-react";

export const metadata = {
  title: "Face Attendance System",
  description: "Real-time facial recognition attendance management",
};

export default function Home() {
  const features = [
    {
      title: "Register Students",
      description: "Capture and store facial encodings for new students",
      icon: Camera,
      href: "/register",
      color: "from-blue-500 to-blue-600",
      textColor: "text-blue-600",
    },
    {
      title: "Mark Attendance",
      description: "Real-time face recognition attendance marking",
      icon: Users,
      href: "/attendance",
      color: "from-green-500 to-green-600",
      textColor: "text-green-600",
    },
    {
      title: "View Records",
      description: "Attendance records and statistics",
      icon: BarChart3,
      href: "/records",
      color: "from-purple-500 to-purple-600",
      textColor: "text-purple-600",
    },
    {
      title: "Admin Dashboard",
      description: "Manage students and system settings",
      icon: Settings,
      href: "/admin",
      color: "from-slate-500 to-slate-600",
      textColor: "text-slate-600",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-blue-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400 to-blue-600">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Face Attendance</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-5xl font-bold tracking-tight text-white md:text-6xl">
            Facial Recognition
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              {" "}Attendance System
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-300">
            Advanced face recognition technology for automated and accurate attendance
            tracking in educational institutions.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 md:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link key={feature.href} href={feature.href}>
                  <Card className="group relative h-full overflow-hidden border-blue-200/20 bg-gradient-to-br from-slate-800 to-slate-900 p-8 transition-all duration-300 hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/10">
                    {/* Background decoration */}
                    <div
                      className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${feature.color} opacity-10 blur-3xl transition-all duration-300 group-hover:opacity-20`}
                    />

                    <div className="relative z-10">
                      <div
                        className={`inline-flex items-center justify-center rounded-lg p-3 ${feature.textColor} bg-gradient-to-br ${feature.color} bg-opacity-10`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>

                      <h3 className="mt-4 text-xl font-semibold text-white">
                        {feature.title}
                      </h3>
                      <p className="mt-2 text-gray-400">
                        {feature.description}
                      </p>

                      <div className="mt-6 flex items-center gap-2 font-semibold">
                        <span className="text-blue-400">Get Started</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="border-t border-blue-800 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h3 className="text-center text-2xl font-bold text-white mb-8">
            Technology Stack
          </h3>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { name: "Next.js 16", desc: "React framework" },
              { name: "Python FastAPI", desc: "Face recognition" },
              { name: "PostgreSQL", desc: "Data storage" },
              { name: "Prisma ORM", desc: "Database client" },
            ].map((tech) => (
              <Card
                key={tech.name}
                className="border-blue-200/20 bg-slate-800/50 p-4 text-center"
              >
                <h4 className="font-semibold text-white">{tech.name}</h4>
                <p className="text-sm text-gray-400">{tech.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Setup Instructions */}
      <section className="border-t border-blue-800 px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <h3 className="text-2xl font-bold text-white mb-6">Quick Start</h3>

          <div className="space-y-4">
            <Card className="border-blue-200/20 bg-slate-800/50 p-4">
              <h4 className="font-semibold text-white">1. Database Setup</h4>
              <p className="mt-2 text-sm text-gray-400">
                Set your DATABASE_URL in .env.local and run database migrations
              </p>
              <code className="mt-3 block rounded bg-slate-900 p-2 text-xs text-green-400 font-mono">
                npx prisma migrate deploy
              </code>
            </Card>

            <Card className="border-blue-200/20 bg-slate-800/50 p-4">
              <h4 className="font-semibold text-white">2. Python Backend</h4>
              <p className="mt-2 text-sm text-gray-400">
                Set up the FastAPI face recognition engine
              </p>
              <code className="mt-3 block rounded bg-slate-900 p-2 text-xs text-green-400 font-mono">
                cd python && pip install -r requirements.txt && python main.py
              </code>
            </Card>

            <Card className="border-blue-200/20 bg-slate-800/50 p-4">
              <h4 className="font-semibold text-white">3. Frontend</h4>
              <p className="mt-2 text-sm text-gray-400">
                Set NEXT_PUBLIC_PYTHON_API_URL in .env.local and start Next.js
              </p>
              <code className="mt-3 block rounded bg-slate-900 p-2 text-xs text-green-400 font-mono">
                npm run dev
              </code>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-blue-800 px-4 py-8">
        <div className="mx-auto max-w-6xl text-center text-gray-400">
          <p>Face Attendance System &copy; 2024. Built with Next.js and Python.</p>
        </div>
      </footer>
    </main>
  );
}
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();