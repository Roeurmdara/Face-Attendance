"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Download,
  Loader2,
  Search,
  Calendar,
  User,
  Clock,
  AlertCircle,
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

export function AttendanceRecords() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    date: new Date().toISOString().split("T")[0],
    studentId: "",
    searchTerm: "",
  });

  // Load attendance records
  useEffect(() => {
    const loadRecords = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (filters.date) {
          params.append("date", filters.date);
        }
        if (filters.studentId) {
          params.append("studentId", filters.studentId);
        }

        const response = await fetch(`/api/attendance?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Failed to fetch records");
        }

        const data = await response.json();

        // Filter by search term if provided
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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({
      ...prev,
      date: e.target.value,
    }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({
      ...prev,
      searchTerm: e.target.value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      date: new Date().toISOString().split("T")[0],
      studentId: "",
      searchTerm: "",
    });
  };

  const handleExportCSV = () => {
    const headers = ["Roll Number", "Name", "Date", "Check-in Time", "Confidence"];
    const rows = records.map((record) => [
      record.student.rollNumber,
      `${record.student.firstName} ${record.student.lastName}`,
      new Date(record.date).toLocaleDateString(),
      new Date(record.checkInTime).toLocaleTimeString(),
      `${Math.round(record.confidence * 100)}%`,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${filters.date}.csv`;
    a.click();
  };

  const getTodayTotal = () => {
    const today = new Date().toISOString().split("T")[0];
    return records.filter(
      (r) => r.date.split("T")[0] === today
    ).length;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.95) return "bg-green-100 text-green-800";
    if (confidence >= 0.85) return "bg-blue-100 text-blue-800";
    if (confidence >= 0.75) return "bg-yellow-100 text-yellow-800";
    return "bg-orange-100 text-orange-800";
  };

  return (
    <div className="space-y-6">
      {/* Filters Card */}
      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Filters</h2>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <Input
              type="date"
              value={filters.date}
              onChange={handleDateChange}
              className="mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Search Student
            </label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Name or Roll Number"
                value={filters.searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleClearFilters}
              variant="outline"
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats Card */}
      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-gray-600">Total Records</p>
            <p className="text-3xl font-bold text-blue-600">{records.length}</p>
          </div>
          <div className="rounded-lg bg-green-50 p-4">
            <p className="text-sm text-gray-600">Today's Attendance</p>
            <p className="text-3xl font-bold text-green-600">{getTodayTotal()}</p>
          </div>
          <div className="rounded-lg bg-purple-50 p-4">
            <p className="text-sm text-gray-600">Average Confidence</p>
            <p className="text-3xl font-bold text-purple-600">
              {records.length > 0
                ? Math.round(
                    (records.reduce((sum, r) => sum + r.confidence, 0) /
                      records.length) *
                      100
                  )
                : 0}
              %
            </p>
          </div>
        </div>
      </Card>

      {/* Records Table */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Attendance Records
          </h2>
          <Button
            onClick={handleExportCSV}
            disabled={records.length === 0}
            size="sm"
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : records.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <p>No attendance records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Roll Number
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Check-in Time
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Confidence
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {record.student.firstName} {record.student.lastName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {record.student.rollNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {new Date(record.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        {new Date(record.checkInTime).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={getConfidenceColor(record.confidence)}
                        variant="secondary"
                      >
                        {Math.round(record.confidence * 100)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
