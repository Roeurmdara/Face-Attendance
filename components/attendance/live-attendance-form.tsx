"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
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
  faceEncodings: number[][] | null;
}

interface MarkedAttendance {
  studentId: number;
  name: string;
  rollNumber: string;
  confidence: number;
  time: string;
}

// Minimum confidence to accept a match — lowered for better recognition
const CONFIDENCE_THRESHOLD = 0.65;

export function LiveAttendanceForm() {
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentWithEncodings[]>([]);
  const [studentsWithEncodings, setStudentsWithEncodings] = useState(0);
  const [markedAttendance, setMarkedAttendance] = useState<MarkedAttendance[]>(
    [],
  );
  const [lastRecognizedStudent, setLastRecognizedStudent] =
    useState<MarkedAttendance | null>(null);
  const [recognitionInProgress, setRecognitionInProgress] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [bestMatchConfidence, setBestMatchConfidence] = useState<number | null>(
    null,
  );

  // useRef so the interval always reads the latest value — avoids stale closure
  const skippedStudentIds = useRef<Set<number>>(new Set());
  const markedAttendanceRef = useRef<MarkedAttendance[]>([]);

  const {
    videoRef,
    canvasRef,
    isActive,
    startCamera,
    stopCamera,
    captureFrame,
  } = useCamera({ onError: (err) => setError(err) });

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/students");
        if (!response.ok) throw new Error("Failed to fetch students");
        const studentsData: StudentWithEncodings[] = await response.json();
        const withEncodings = studentsData.filter(
          (s) =>
            s.faceEncodings &&
            Array.isArray(s.faceEncodings) &&
            s.faceEncodings.length > 0,
        );
        setStudents(studentsData);
        setStudentsWithEncodings(withEncodings.length);
        if (studentsData.length > 0 && withEncodings.length === 0) {
          setError(
            "No students have face encodings. Please re-register students with face capture.",
          );
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load students",
        );
      } finally {
        setIsLoading(false);
      }
    };
    loadStudents();
  }, []);

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

        const studentsToCheck = students.filter(
          (s) =>
            s.faceEncodings &&
            Array.isArray(s.faceEncodings) &&
            s.faceEncodings.length > 0 &&
            !markedAttendanceRef.current.some(
              (att) => att.studentId === s.id,
            ) &&
            !skippedStudentIds.current.has(s.id),
        );

        if (studentsToCheck.length === 0) {
          setRecognitionInProgress(false);
          return;
        }

        // Flatten all encodings from all students with their IDs
        const allEncodings: { studentId: number; encoding: number[] }[] = [];
        for (const student of studentsToCheck) {
          for (const encoding of student.faceEncodings as number[][]) {
            allEncodings.push({ studentId: student.id, encoding });
          }
        }

        // Single API call with ALL encodings - much faster!
        const response = await fetch("/api/face/recognize-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            test_image_data: imageData,
            stored_encodings: allEncodings.map((e) => e.encoding),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (errorData.error?.includes("No faces detected")) {
            setFaceDetected(false);
            setBestMatchConfidence(null);
          }
          setRecognitionInProgress(false);
          return;
        }

        const result = await response.json();
        console.log("Batch recognition result:", result);

        if (!result.recognized) {
          // Face detected but NOT recognized as any registered student
          setRecognitionError("Student not recognized. Must register first.");
          setRecognitionInProgress(false);
          return;
        }

        // Face recognized - result.student_id is the INDEX in allEncodings array
        const matchedIndex = result.student_id;
        if (
          matchedIndex === null ||
          matchedIndex === undefined ||
          matchedIndex < 0
        ) {
          setRecognitionInProgress(false);
          return;
        }

        const matchedEncoding = allEncodings[matchedIndex];
        if (!matchedEncoding) {
          console.error(`No encoding found at index ${matchedIndex}`);
          setRecognitionInProgress(false);
          return;
        }

        const matchedStudent = studentsToCheck.find(
          (s) => s.id === matchedEncoding.studentId,
        );

        if (!matchedStudent) {
          console.error(
            `No student found with id ${matchedEncoding.studentId}`,
          );
          setRecognitionInProgress(false);
          return;
        }

        console.log("Matched student:", matchedStudent);

        setFaceDetected(true);
        setBestMatchConfidence(result.confidence);

        try {
          console.log("Recording attendance for student:", matchedStudent.id);
          const attendanceResponse = await fetch("/api/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentId: matchedStudent.id,
              confidence: result.confidence,
            }),
          });

          const resData = await attendanceResponse.json().catch(() => ({}));

          if (attendanceResponse.ok) {
            const newAttendance: MarkedAttendance = {
              studentId: matchedStudent.id,
              name: `${matchedStudent.firstName} ${matchedStudent.lastName}`,
              rollNumber: matchedStudent.rollNumber,
              confidence: result.confidence,
              time: new Date().toLocaleTimeString(),
            };
            markedAttendanceRef.current = [
              newAttendance,
              ...markedAttendanceRef.current,
            ];
            setMarkedAttendance(markedAttendanceRef.current);
            setLastRecognizedStudent(newAttendance);
            setRecognitionError(null);
            setFaceDetected(false);
            setBestMatchConfidence(null);
          } else {
            // Handle 409 conflict (already marked)
            if (attendanceResponse.status === 409) {
              skippedStudentIds.current.add(matchedStudent.id);
              setRecognitionError(
                resData.error || "Student already marked present today",
              );
            } else {
              skippedStudentIds.current.add(matchedStudent.id);
              setRecognitionError(
                resData.error || "Failed to record attendance",
              );
            }
          }
        } catch (err) {
          skippedStudentIds.current.add(matchedStudent.id);
          setRecognitionError(
            err instanceof Error ? err.message : "Failed to record attendance",
          );
        }
      } catch (err) {
        console.error("Recognition error:", err);
      } finally {
        setRecognitionInProgress(false);
      }
    }, 1500); // Reduced from 2000ms to 1500ms for faster response

    return () => clearInterval(recognitionInterval);
  }, [isRunning, isActive, students, captureFrame, recognitionInProgress]);

  const handleStartAttendance = async () => {
    setError(null);
    setRecognitionError(null);
    setMarkedAttendance([]);
    setLastRecognizedStudent(null);
    setFaceDetected(false);
    setBestMatchConfidence(null);
    skippedStudentIds.current = new Set();
    markedAttendanceRef.current = [];
    if (students.length === 0) {
      setError("No registered students found");
      return;
    }
    if (studentsWithEncodings === 0) {
      setError(
        "No students have face encodings saved. Please re-register students.",
      );
      return;
    }
    await startCamera();
    setIsRunning(true);
  };

  const handleStopAttendance = () => {
    setIsRunning(false);
    stopCamera();
    setFaceDetected(false);
    setBestMatchConfidence(null);
    setRecognitionError(null);
  };

  const handleClearAttendance = () => {
    setMarkedAttendance([]);
    setLastRecognizedStudent(null);
    setFaceDetected(false);
    setBestMatchConfidence(null);
    skippedStudentIds.current = new Set();
    markedAttendanceRef.current = [];
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-3xl space-y-5">
        {/* Page header */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-400 mb-1">
            Attendance
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Live recognition
          </h1>
        </div>

        {/* Stat strip */}
        {!isLoading && students.length > 0 && (
          <div className="rounded-xl bg-white border border-slate-100 px-5 py-3 flex items-center gap-3 text-sm">
            <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-600">
              {students.length} student{students.length !== 1 ? "s" : ""}{" "}
              registered
            </span>
            <span className="text-slate-200">|</span>
            <span
              className={
                studentsWithEncodings > 0 ? "text-green-600" : "text-red-500"
              }
            >
              {studentsWithEncodings} with face data
            </span>
          </div>
        )}

        {/* Errors */}
        {error && (
          <Alert className="border-red-200 bg-red-50 rounded-xl">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700 text-sm">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
          </div>
        )}

        {!isLoading && (
          <div className="space-y-4">
            {/* Camera card */}
            <div className="rounded-xl bg-white border border-slate-100 overflow-hidden">
              <div
                className="relative bg-slate-900"
                style={{ aspectRatio: "16/9" }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {!isActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <Camera className="h-10 w-10 text-slate-600" />
                    <p className="text-xs text-slate-500">Camera not started</p>
                  </div>
                )}
                {isActive && (
                  <div className="absolute bottom-3 right-3">
                    {recognitionInProgress ? (
                      <span className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Recognizing
                      </span>
                    ) : isRunning ? (
                      <span className="flex items-center gap-1.5 bg-green-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        Live
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} className="hidden" />

              {/* Controls */}
              <div className="px-5 py-4 flex items-center gap-3 border-t border-slate-50">
                {!isRunning ? (
                  <Button
                    onClick={handleStartAttendance}
                    disabled={isLoading || studentsWithEncodings === 0}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium h-9 rounded-lg flex items-center gap-2 disabled:opacity-40 transition-colors"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Start attendance
                  </Button>
                ) : (
                  <Button
                    onClick={handleStopAttendance}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium h-9 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Square className="h-3.5 w-3.5" />
                    Stop attendance
                  </Button>
                )}
                <Button
                  onClick={handleClearAttendance}
                  disabled={markedAttendance.length === 0}
                  variant="outline"
                  className="h-9 px-4 text-sm border-slate-200 text-slate-500 hover:bg-slate-50 rounded-lg disabled:opacity-40"
                >
                  Clear
                </Button>
              </div>
            </div>

            {/* Success - Student marked present */}
            {lastRecognizedStudent && (
              <Alert className="border-green-200 bg-green-50 rounded-xl">
                <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                <AlertDescription>
                  <span className="text-sm font-semibold text-green-900">
                    ✓ Success! {lastRecognizedStudent.name} marked present.
                  </span>
                  <span className="text-sm text-green-700 ml-2">
                    {lastRecognizedStudent.rollNumber} ·{" "}
                    {lastRecognizedStudent.time} ·{" "}
                    {getConfidencePercentage(lastRecognizedStudent.confidence)}%
                    confidence
                  </span>
                </AlertDescription>
              </Alert>
            )}

            {recognitionError && (
              <Alert className="border-red-200 bg-red-50 rounded-xl">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-700 text-sm">
                  {recognitionError}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Marked attendance list */}
        <div className="rounded-xl bg-white border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Marked attendance
            </p>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              {markedAttendance.length}
            </span>
          </div>

          {markedAttendance.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-400">
                No attendance marked yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {markedAttendance.map((att) => (
                <div
                  key={att.studentId}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {att.name}
                      </p>
                      <p className="font-mono text-xs text-slate-400">
                        {att.rollNumber}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className="text-sm text-slate-500">{att.time}</span>
                    <Badge className="bg-blue-50 text-blue-700 border border-blue-200 font-medium text-xs">
                      {getConfidencePercentage(att.confidence)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
