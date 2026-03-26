"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Camera, CheckCircle, AlertCircle } from "lucide-react";
import { useCamera } from "@/hooks/use-camera";
import { encodeFace, imageToBase64 } from "@/lib/face-recognition";

interface RegistrationStep {
  step: "details" | "capture" | "confirm";
}

interface StudentData {
  rollNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

const STEPS = ["details", "capture", "confirm"] as const;
const STEP_LABELS = ["Information", "Face capture", "Confirm"];

export function StudentRegistrationForm() {
  const [currentStep, setCurrentStep] = useState<RegistrationStep["step"]>("details");
  const [studentData, setStudentData] = useState<StudentData>({
    rollNumber: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
  });

  const [encodedFaces, setEncodedFaces] = useState<number[][]>([]);
  const [capturedCount, setCapturedCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { videoRef, canvasRef, isActive, startCamera, stopCamera, captureFrame } =
    useCamera({ onError: (err) => setError(err) });

  const handleDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStudentData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentData.rollNumber || !studentData.firstName || !studentData.lastName) {
      setError("Roll number, first name, and last name are required");
      return;
    }
    setError(null);
    setCurrentStep("capture");
    setTimeout(() => startCamera(), 100);
  };

  const handleCaptureFace = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const imageData = captureFrame();
      if (!imageData) { setError("Failed to capture image from camera"); return; }
      const result = await encodeFace(imageData);
      if (!result.success) {
        setError(result.error || "Failed to encode face. Make sure your face is clearly visible.");
        return;
      }
      if (result.encoding) {
        const newFaces = [...encodedFaces, result.encoding];
        setEncodedFaces(newFaces);
        const newCount = capturedCount + 1;
        setCapturedCount(newCount);
        if (newCount >= 5) { stopCamera(); setCurrentStep("confirm"); }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error capturing face");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setIsProcessing(true);
    setError(null);
    const newFaces = [...encodedFaces];
    const errors: string[] = [];
    try {
      for (let i = 0; i < Math.min(files.length, 5 - capturedCount); i++) {
        const file = files[i];
        try {
          const imageData = await imageToBase64(file);
          const result = await encodeFace(imageData);
          if (result.success && result.encoding) {
            newFaces.push(result.encoding);
          } else {
            errors.push(`${file.name}: ${result.error || "Could not detect face"}`);
          }
        } catch {
          errors.push(`${file.name}: Failed to process`);
        }
      }
      setEncodedFaces(newFaces);
      setCapturedCount(newFaces.length);
      if (errors.length > 0) setError(errors.join("\n"));
      if (newFaces.length >= 5) { stopCamera(); setCurrentStep("confirm"); }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error processing images");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleConfirmRegistration = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      if (encodedFaces.length === 0) {
        throw new Error("No face encodings captured. Please go back and capture face samples.");
      }
      const studentResponse = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...studentData, faceEncodings: encodedFaces }),
      });
      if (!studentResponse.ok) {
        const errData = await studentResponse.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to register student");
      }
      setSuccess(true);
      setTimeout(() => { window.location.href = "/"; }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register student");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetakePhotos = () => {
    setEncodedFaces([]);
    setCapturedCount(0);
    setError(null);
    setCurrentStep("capture");
    setTimeout(() => startCamera(), 100);
  };

  const stepIndex = STEPS.indexOf(currentStep);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-3xl space-y-5">

        {/* Page header */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-400 mb-1">
            Admin
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">Register student</h1>
        </div>

        {/* Step indicator */}
        <div className="rounded-xl bg-white border border-slate-100 px-5 py-4">
          <div className="flex items-center gap-0">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 transition-colors ${
                      i < stepIndex
                        ? "bg-blue-600 text-white"
                        : i === stepIndex
                        ? "bg-blue-50 text-blue-600 border border-blue-200"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {i < stepIndex ? <CheckCircle className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      i === stepIndex ? "text-slate-900" : "text-slate-400"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className={`flex-1 h-px mx-3 ${i < stepIndex ? "bg-blue-200" : "bg-slate-100"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Step 1: Details ── */}
        {currentStep === "details" && (
          <div className="rounded-xl bg-white border border-slate-100 px-5 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-4">
              Student information
            </p>
            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { name: "rollNumber", label: "Roll number", placeholder: "e.g. CSE001", required: true },
                  { name: "firstName",  label: "First name",  placeholder: "John",        required: true },
                  { name: "lastName",   label: "Last name",   placeholder: "Doe",         required: true },
                  { name: "email",      label: "Email",       placeholder: "john@example.com", type: "email" },
                ].map(({ name, label, placeholder, required, type }) => (
                  <div key={name}>
                    <label className="text-xs font-medium text-slate-500 mb-1.5 block">
                      {label}{required && <span className="text-blue-400 ml-0.5">*</span>}
                    </label>
                    <Input
                      name={name}
                      type={type ?? "text"}
                      value={studentData[name as keyof StudentData]}
                      onChange={handleDetailsChange}
                      placeholder={placeholder}
                      disabled={isProcessing}
                      className="h-9 text-sm border-slate-200 rounded-lg focus-visible:ring-blue-100 focus-visible:border-blue-400"
                    />
                  </div>
                ))}
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-slate-500 mb-1.5 block">Phone number</label>
                  <Input
                    name="phoneNumber"
                    value={studentData.phoneNumber}
                    onChange={handleDetailsChange}
                    placeholder="+1234567890"
                    disabled={isProcessing}
                    className="h-9 text-sm border-slate-200 rounded-lg focus-visible:ring-blue-100 focus-visible:border-blue-400"
                  />
                </div>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50 rounded-xl">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium h-9 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-40"
              >
                {isProcessing ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing...</> : "Continue to face capture"}
              </Button>
            </form>
          </div>
        )}

        {/* ── Step 2: Capture ── */}
        {currentStep === "capture" && (
          <div className="rounded-xl bg-white border border-slate-100 overflow-hidden">
            {/* Camera */}
            <div className="relative bg-slate-900" style={{ aspectRatio: "4/3" }}>
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              {!isActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <Camera className="h-10 w-10 text-slate-600" />
                  <p className="text-xs text-slate-500">Starting camera...</p>
                </div>
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />

            <div className="px-5 py-4 space-y-4">
              {/* Progress */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-500 shrink-0">
                  {capturedCount}/5 captured
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${(capturedCount / 5) * 100}%` }}
                  />
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-blue-700">
                Face the camera directly with good lighting. Try slightly different angles for each capture.
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50 rounded-xl">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-700 text-sm whitespace-pre-line">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleCaptureFace}
                disabled={isProcessing || !isActive || capturedCount >= 5}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium h-9 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-40"
              >
                {isProcessing
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing...</>
                  : <><Camera className="h-3.5 w-3.5" /> Capture face ({5 - capturedCount} remaining)</>
                }
              </Button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs text-slate-400">or upload images</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing || capturedCount >= 5}
                className="w-full h-9 text-sm border-slate-200 text-slate-500 hover:bg-slate-50 rounded-lg disabled:opacity-40"
              >
                Upload images
              </Button>
              <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />

              {capturedCount >= 5 && (
                <Button
                  onClick={() => setCurrentStep("confirm")}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium h-9 rounded-lg transition-colors"
                >
                  Proceed to confirm
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ── Step 3: Confirm ── */}
        {currentStep === "confirm" && (
          <div className="rounded-xl bg-white border border-slate-100 px-5 py-5 space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Review & confirm
            </p>

            <div className="rounded-lg bg-slate-50 border border-slate-100 divide-y divide-slate-100">
              {[
                { label: "Roll number", value: studentData.rollNumber },
                { label: "Name", value: `${studentData.firstName} ${studentData.lastName}` },
                ...(studentData.email ? [{ label: "Email", value: studentData.email }] : []),
                ...(studentData.phoneNumber ? [{ label: "Phone", value: studentData.phoneNumber }] : []),
                { label: "Face samples", value: `${capturedCount} captured`, highlight: true },
                { label: "Encoding vectors", value: `${encodedFaces.length} ready`, highlight: true },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className={`text-xs font-medium ${highlight ? "text-green-600" : "text-slate-900"}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {success && (
              <Alert className="border-green-200 bg-green-50 rounded-xl">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700 text-sm">
                  Student registered successfully! Redirecting...
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="border-red-200 bg-red-50 rounded-xl">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleRetakePhotos}
                disabled={isProcessing || success}
                variant="outline"
                className="flex-1 h-9 text-sm border-slate-200 text-slate-500 hover:bg-slate-50 rounded-lg disabled:opacity-40"
              >
                Retake photos
              </Button>
              <Button
                onClick={handleConfirmRegistration}
                disabled={isProcessing || success || encodedFaces.length === 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium h-9 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
              >
                {isProcessing
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Registering...</>
                  : <><CheckCircle className="h-3.5 w-3.5" /> Confirm & register</>
                }
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}