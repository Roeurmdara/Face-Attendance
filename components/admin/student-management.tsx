"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Trash2,
  Edit2,
  Plus,
  Search,
  AlertCircle,
  CheckCircle,
  Mail,
  Calendar,
} from "lucide-react";

interface Student {
  id: number;
  rollNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phoneNumber: string | null;
  faceEncodingPath: string | null;
  registeredAt: string;
}

export function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch("/api/students");
        if (!response.ok) throw new Error("Failed to fetch students");
        const data = await response.json();
        setStudents(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load students");
      } finally {
        setIsLoading(false);
      }
    };
    loadStudents();
  }, []);

  const handleDelete = (student: Student) => {
    setDeleteTarget(student);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/students/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete student");
      setStudents((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setSuccess(`${deleteTarget.firstName} ${deleteTarget.lastName} deleted successfully`);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete student");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const registeredToday = students.filter((s) => {
    const today = new Date();
    return new Date(s.registeredAt).toDateString() === today.toDateString();
  }).length;

  const faceRecognized = students.filter((s) => s.faceEncodingPath).length;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-5">

        {/* Page header */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-400 mb-1">
              Admin
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">Students</h1>
          </div>
          <Button
            asChild
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 h-9 rounded-lg flex items-center gap-2 transition-colors"
          >
            <a href="/register">
              <Plus className="h-4 w-4" />
              Add student
            </a>
          </Button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total students", value: students.length },
            { label: "Registered today", value: registeredToday },
            { label: "Face recognized", value: faceRecognized },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl bg-white border border-slate-100 px-5 py-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
                {label}
              </p>
              <p className="text-3xl font-semibold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {error && (
          <Alert className="border-red-200 bg-red-50 rounded-xl">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="border-green-200 bg-green-50 rounded-xl">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 text-sm">{success}</AlertDescription>
          </Alert>
        )}

        {/* Search */}
        <div className="rounded-xl bg-white border border-slate-100 px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
            Search
          </p>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Name, roll number or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9 text-sm border-slate-200 rounded-lg focus-visible:ring-blue-100 focus-visible:border-blue-400"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl bg-white border border-slate-100 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-slate-400">
                {searchTerm
                  ? "No students match your search."
                  : "No students registered yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["Name", "Roll no.", "Email", "Status", "Registered", ""].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400"
                        >
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, i) => (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        i < filteredStudents.length - 1
                          ? "border-b border-slate-50"
                          : ""
                      }`}
                    >
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-900">
                        {student.firstName} {student.lastName}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                        {student.rollNumber}
                      </td>
                      <td className="px-5 py-3.5">
                        {student.email ? (
                          <span className="flex items-center gap-1.5 text-sm text-slate-500">
                            <Mail className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                            {student.email}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {student.faceEncodingPath ? (
                          <Badge className="bg-green-50 text-green-700 border border-green-200 font-medium text-xs flex items-center gap-1 w-fit">
                            <CheckCircle className="h-3 w-3" />
                            Registered
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-50 text-slate-500 border border-slate-200 font-medium text-xs">
                            Pending
                          </Badge>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-1.5 text-sm text-slate-500">
                          <Calendar className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                          {new Date(student.registeredAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              (window.location.href = `/admin/${student.id}`)
                            }
                            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(student)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-xl border border-slate-100 shadow-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 font-semibold">
              Delete student
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 text-sm">
              Are you sure you want to delete{" "}
              <span className="font-medium text-slate-700">
                {deleteTarget?.firstName} {deleteTarget?.lastName}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-2">
            <AlertDialogCancel
              disabled={isDeleting}
              className="h-9 px-4 text-sm rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="h-9 px-4 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}