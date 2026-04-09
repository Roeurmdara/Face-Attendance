"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Download,
  Loader2,
  Search,
  Calendar,
  Clock,
  AlertCircle,
  X,
} from "lucide-react";

interface AttendanceRecord {
  id: number;
  studentId: number;
  date: string;
  checkInTime: string;
  confidence: number;
  student: {
    id: number;
    rollNumber: string;
    firstName: string;
    lastName: string;
  };
}

interface FilterOptions {
  date: string;
  studentId: string;
  searchTerm: string;
}

type AttendanceStatus = "On Time" | "Late" | "Absent";

function getAttendanceStatus(checkInTime: string): AttendanceStatus {
  const date = new Date(checkInTime);
  const totalMinutes = date.getHours() * 60 + date.getMinutes();
  if (totalMinutes < 7 * 60 + 30) return "On Time";
  if (totalMinutes < 7 * 60 + 50) return "Late";
  return "Absent";
}

function StatusBadge({ status }: { status: AttendanceStatus }) {
  if (status === "On Time")
    return <Badge className="bg-green-50 text-green-700 border border-green-200 font-medium text-xs">On Time</Badge>;
  if (status === "Late")
    return <Badge className="bg-amber-50 text-amber-700 border border-amber-200 font-medium text-xs">Late</Badge>;
  return <Badge className="bg-red-50 text-red-700 border border-red-200 font-medium text-xs">Absent</Badge>;
}

export function AttendanceRecords() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    date: new Date().toISOString().split("T")[0],
    studentId: "",
    searchTerm: "",
  });

  useEffect(() => {
    const loadRecords = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (filters.date) params.append("date", filters.date);
        if (filters.studentId) params.append("studentId", filters.studentId);

        const response = await fetch(`/api/attendance?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch records");

        const data = await response.json();

        let filtered = data;
        if (filters.searchTerm) {
          const term = filters.searchTerm.toLowerCase();
          filtered = data.filter(
            (record: AttendanceRecord) =>
              record.student.firstName.toLowerCase().includes(term) ||
              record.student.lastName.toLowerCase().includes(term) ||
              record.student.rollNumber.toLowerCase().includes(term)
          );
        }

        setRecords(filtered);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load records");
      } finally {
        setIsLoading(false);
      }
    };

    loadRecords();
  }, [filters.date, filters.studentId]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFilters((prev) => ({ ...prev, date: e.target.value }));

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFilters((prev) => ({ ...prev, searchTerm: e.target.value }));

  const handleClearFilters = () =>
    setFilters({
      date: new Date().toISOString().split("T")[0],
      studentId: "",
      searchTerm: "",
    });

  const handleExportCSV = () => {
    const headers = ["Roll Number", "Name", "Date", "Check-in Time", "Status", "Confidence"];
    const rows = records.map((record) => [
      record.student.rollNumber,
      `${record.student.firstName} ${record.student.lastName}`,
      new Date(record.date).toLocaleDateString(),
      new Date(record.checkInTime).toLocaleTimeString(),
      getAttendanceStatus(record.checkInTime),
      `${Math.round(record.confidence * 100)}%`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${filters.date}.csv`;
    a.click();
  };

  const getTodayTotal = () => {
    const today = new Date().toISOString().split("T")[0];
    return records.filter((r) => r.date.split("T")[0] === today).length;
  };

  const avgConfidence =
    records.length > 0
      ? Math.round(
          (records.reduce((sum, r) => sum + r.confidence, 0) / records.length) * 100
        )
      : 0;

  const getConfidenceBadge = (confidence: number) => {
    const pct = Math.round(confidence * 100);
    if (confidence >= 0.95)
      return (
        <Badge className="bg-green-50 text-green-700 border border-green-200 font-medium text-xs">
          {pct}%
        </Badge>
      );
    if (confidence >= 0.85)
      return (
        <Badge className="bg-blue-50 text-blue-700 border border-blue-200 font-medium text-xs">
          {pct}%
        </Badge>
      );
    if (confidence >= 0.75)
      return (
        <Badge className="bg-amber-50 text-amber-700 border border-amber-200 font-medium text-xs">
          {pct}%
        </Badge>
      );
    return (
      <Badge className="bg-orange-50 text-orange-700 border border-orange-200 font-medium text-xs">
        {pct}%
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-5">

        {/* Page header */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-400 mb-1">
              Classroom
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              Attendance
            </h1>
          </div>
          <Button
            onClick={handleExportCSV}
            disabled={records.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 h-9 rounded-lg flex items-center gap-2 disabled:opacity-40 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total records", value: records.length },
            { label: "Today", value: getTodayTotal() },
            { label: "Avg confidence", value: `${avgConfidence}%` },
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

        {/* Filters */}
        <div className="rounded-xl bg-white border border-slate-100 px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
            Filters
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:items-end">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">
                Date
              </label>
              <Input
                type="date"
                value={filters.date}
                onChange={handleDateChange}
                className="h-9 text-sm border-slate-200 rounded-lg focus-visible:ring-blue-100 focus-visible:border-blue-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">
                Search student
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <Input
                  placeholder="Name or roll number"
                  value={filters.searchTerm}
                  onChange={handleSearchChange}
                  className="pl-8 h-9 text-sm border-slate-200 rounded-lg focus-visible:ring-blue-100 focus-visible:border-blue-400"
                />
              </div>
            </div>
            <div>
            <Button
              onClick={handleClearFilters}
              variant="outline"
              className="h-9 w-full md:w-auto text-sm rounded-lg flex items-center justify-center gap-2 border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <X className="h-4 w-4" />
              Clear filters
            </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl bg-white border border-slate-100 overflow-hidden">
          {error && (
            <div className="p-4 border-b border-slate-100">
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-700 text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
            </div>
          ) : records.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-slate-400">No attendance records found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["Student", "Roll no.", "Date", "Check-in", "Status", "Confidence"].map(
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
                  {records.map((record, i) => (
                    <tr
                      key={record.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        i < records.length - 1 ? "border-b border-slate-50" : ""
                      }`}
                    >
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-900">
                        {record.student.firstName} {record.student.lastName}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                        {record.student.rollNumber}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-1.5 text-sm text-slate-500">
                          <Calendar className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                          {new Date(record.date).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-1.5 text-sm text-slate-500">
                          <Clock className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                          {new Date(record.checkInTime).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={getAttendanceStatus(record.checkInTime)} />
                      </td>
                      <td className="px-5 py-3.5">
                        {getConfidenceBadge(record.confidence)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}