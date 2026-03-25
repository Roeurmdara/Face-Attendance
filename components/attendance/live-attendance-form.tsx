"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Play,
  Square,
  CheckCircle,
  AlertCircle,
  Camera,
  Users,
} from "lucide-react";
import { useCamera } from "@/hooks/use-camera";
import { recognizeFace, getConfidencePercentage } from "@/lib/face-recognition";

interface StudentWithEncodings {
  id: number;
  rollNumber: string;
  firstName: string;
  lastName: string;
  faceEncodingPath: string | null;
  faceEncodings: number[][] | null; // ← comes directly from DB now
}

interface MarkedAttendance {
  studentId: number;
  name: string;
  rollNumber: string;
  confidence: number;
  time: string;
}

export function LiveAttendanceForm() {
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentWithEncodings[]>([]);
  const [studentsWithEncodings, setStudentsWithEncodings] = useState(0);
  const [markedAttendance, setMarkedAttendance] = useState<MarkedAttendance[]>([]);
  const [lastRecognizedStudent, setLastRecognizedStudent] = useState<MarkedAttendance | null>(null);
  const [recognitionInProgress, setRecognitionInProgress] = useState(false);

  const { videoRef, canvasRef, isActive, startCamera, stopCamera, captureFrame } =
    useCamera({ onError: (err) => setError(err) });

  // Load students with encodings from the database
  useEffect(() => {
    const loadStudents = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/students");

        if (!response.ok) {
          throw new Error("Failed to fetch students");
        }

        const studentsData: StudentWithEncodings[] = await response.json();

        // Count how many have actual encodings
        const withEncodings = studentsData.filter(
          (s) => s.faceEncodings && Array.isArray(s.faceEncodings) && s.faceEncodings.length > 0
        );

        setStudents(studentsData);
        setStudentsWithEncodings(withEncodings.length);

        if (studentsData.length > 0 && withEncodings.length === 0) {
          setError(
            "No students have face encodings. Please re-register students with face capture."
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load students");
      } finally {
        setIsLoading(false);
      }
    };

    loadStudents();
  }, []);

  // Continuous recognition loop
  useEffect(() => {
    if (!isRunning || !isActive || students.length === 0) return;

    const recognitionInterval = setInterval(async () => {
      if (recognitionInProgress) return;

      try {
        setRecognitionInProgress(true);
        const imageData = captureFrame();

        if (!imageData) {
          setRecognitionInProgress(false);
          return;
        }

        // Only process students that have encodings stored
        const studentsToCheck = students.filter(
          (s) => s.faceEncodings && Array.isArray(s.faceEncodings) && s.faceEncodings.length > 0
        );

        if (studentsToCheck.length === 0) {
          setRecognitionInProgress(false);
          return;
        }

        // Try recognition against each student's stored encodings
        for (const student of studentsToCheck) {
          // Skip if already marked attendance today
          const alreadyMarked = markedAttendance.some(
            (att) => att.studentId === student.id
          );
          if (alreadyMarked) continue;

          const encodings = student.faceEncodings as number[][];
          const result = await recognizeFace(imageData, encodings);

          if (result.recognized && result.confidence && result.confidence > 0.6) {
            // Mark attendance in the database
            try {
              const response = await fetch("/api/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  studentId: student.id,
                  confidence: result.confidence,
                }),
              });

              if (response.ok) {
                const newAttendance: MarkedAttendance = {
                  studentId: student.id,
                  name: `${student.firstName} ${student.lastName}`,
                  rollNumber: student.rollNumber,
                  confidence: result.confidence,
                  time: new Date().toLocaleTimeString(),
                };

                setMarkedAttendance((prev) => [newAttendance, ...prev]);
                setLastRecognizedStudent(newAttendance);
                setRecognitionError(null);
              } else {
                const errData = await response.json().catch(() => ({}));
                setRecognitionError(errData.error || "Failed to record attendance");
              }
            } catch (err) {
              setRecognitionError(
                err instanceof Error ? err.message : "Failed to record attendance"
              );
            }

            // Found a match — stop checking other students this frame
            setRecognitionInProgress(false);
            return;
          }
        }
      } catch (err) {
        console.error("Recognition error:", err);
      } finally {
        setRecognitionInProgress(false);
      }
    }, 2000);

    return () => clearInterval(recognitionInterval);
  }, [isRunning, isActive, students, captureFrame, markedAttendance, recognitionInProgress]);

  const handleStartAttendance = async () => {
    setError(null);
    setRecognitionError(null);
    setMarkedAttendance([]);
    setLastRecognizedStudent(null);

    if (students.length === 0) {
      setError("No registered students found");
      return;
    }

    if (studentsWithEncodings === 0) {
      setError(
        "No students have face encodings saved. Please re-register students."
      );
      return;
    }

    await startCamera();
    setIsRunning(true);
  };

  const handleStopAttendance = () => {
    setIsRunning(false);
    stopCamera();
  };

  const handleClearAttendance = () => {
    setMarkedAttendance([]);
    setLastRecognizedStudent(null);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="mb-6 text-2xl font-semibold text-gray-900">
          Live Recognition
        </h2>

        {/* Student stats banner */}
        {!isLoading && students.length > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-sm">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">
              {students.length} student{students.length > 1 ? "s" : ""} registered
            </span>
            <span className="mx-2 text-gray-300">|</span>
            <span className={studentsWithEncodings > 0 ? "text-green-600" : "text-red-600"}>
              {studentsWithEncodings} with face data
            </span>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}

        {!isLoading && (
          <div className="space-y-4">
            {/* Camera Feed */}
            <div className="relative overflow-hidden rounded-lg bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="h-96 w-full object-cover"
              />
              {!isActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-center">
                    <Camera className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-400">Camera not started</p>
                  </div>
                </div>
              )}
              {recognitionInProgress && (
                <div className="absolute bottom-4 right-4 rounded-lg bg-blue-600 px-3 py-1 text-sm text-white flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Recognizing...
                </div>
              )}
              {isRunning && isActive && !recognitionInProgress && (
                <div className="absolute bottom-4 right-4 rounded-lg bg-green-600 px-3 py-1 text-sm text-white flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  Live
                </div>
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />

            {/* Last Recognized */}
            {lastRecognizedStudent && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="font-semibold">{lastRecognizedStudent.name}</div>
                  <div className="text-sm">
                    Roll: {lastRecognizedStudent.rollNumber} | Time:{" "}
                    {lastRecognizedStudent.time} | Confidence:{" "}
                    {getConfidencePercentage(lastRecognizedStudent.confidence)}%
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {recognitionError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{recognitionError}</AlertDescription>
              </Alert>
            )}

            {/* Control Buttons */}
            <div className="flex gap-3">
              {!isRunning ? (
                <Button
                  onClick={handleStartAttendance}
                  disabled={isLoading || studentsWithEncodings === 0}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start Attendance
                </Button>
              ) : (
                <Button
                  onClick={handleStopAttendance}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  size="lg"
                >
                  <Square className="mr-2 h-4 w-4" />
                  Stop Attendance
                </Button>
              )}

              <Button
                onClick={handleClearAttendance}
                variant="outline"
                disabled={markedAttendance.length === 0}
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Marked Attendance List */}
      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Attendance Marked ({markedAttendance.length})
        </h2>

        {markedAttendance.length === 0 ? (
          <p className="text-center text-gray-500">
            No attendance marked yet. Start the system to begin.
          </p>
        ) : (
          <div className="space-y-3">
            {markedAttendance.map((att) => (
              <div
                key={att.studentId}
                className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-semibold text-gray-900">{att.name}</div>
                    <div className="text-sm text-gray-600">{att.rollNumber}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{att.time}</div>
                  <Badge variant="secondary" className="mt-1">
                    {getConfidencePercentage(att.confidence)}% confidence
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}