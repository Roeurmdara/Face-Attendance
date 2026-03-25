"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
      if (!imageData) {
        setError("Failed to capture image from camera");
        return;
      }

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

        if (newCount >= 5) {
          stopCamera();
          setCurrentStep("confirm");
        }
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

      if (errors.length > 0) {
        setError(errors.join("\n"));
      }

      if (newFaces.length >= 5) {
        stopCamera();
        setCurrentStep("confirm");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error processing images");
    } finally {
      setIsProcessing(false);
      // Reset file input so the same file can be re-selected if needed
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

      // Send student data AND face encodings together in one request
      const studentResponse = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...studentData,
          faceEncodings: encodedFaces, // ← THE FIX: include encodings
        }),
      });

      if (!studentResponse.ok) {
        const errData = await studentResponse.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to register student");
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
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

  return (
    <div className="space-y-6">
      {/* Details Step */}
      {currentStep === "details" && (
        <Card className="p-6">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900">
            Student Information
          </h2>

          <form onSubmit={handleDetailsSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Roll Number *
                </label>
                <Input
                  name="rollNumber"
                  value={studentData.rollNumber}
                  onChange={handleDetailsChange}
                  placeholder="e.g., CSE001"
                  className="mt-1"
                  disabled={isProcessing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  First Name *
                </label>
                <Input
                  name="firstName"
                  value={studentData.firstName}
                  onChange={handleDetailsChange}
                  placeholder="John"
                  className="mt-1"
                  disabled={isProcessing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Name *
                </label>
                <Input
                  name="lastName"
                  value={studentData.lastName}
                  onChange={handleDetailsChange}
                  placeholder="Doe"
                  className="mt-1"
                  disabled={isProcessing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  name="email"
                  type="email"
                  value={studentData.email}
                  onChange={handleDetailsChange}
                  placeholder="john@example.com"
                  className="mt-1"
                  disabled={isProcessing}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <Input
                  name="phoneNumber"
                  value={studentData.phoneNumber}
                  onChange={handleDetailsChange}
                  placeholder="+1234567890"
                  className="mt-1"
                  disabled={isProcessing}
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={isProcessing} className="w-full">
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Continue to Face Capture"
              )}
            </Button>
          </form>
        </Card>
      )}

      {/* Capture Step */}
      {currentStep === "capture" && (
        <Card className="p-6">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900">
            Capture Face Samples
          </h2>

          <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
            <strong>Tips for best results:</strong> Face the camera directly, ensure good lighting,
            and try slightly different angles for each capture (left, right, up, down, straight).
          </div>

          <div className="mb-6 space-y-4">
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
                    <p className="mt-2 text-sm text-gray-400">Starting camera...</p>
                  </div>
                </div>
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />

            <div className="flex items-center justify-between rounded-lg bg-blue-50 p-4">
              <span className="text-sm font-medium text-gray-900">
                Captured: {capturedCount}/5
              </span>
              <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${(capturedCount / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleCaptureFace}
              disabled={isProcessing || !isActive || capturedCount >= 5}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  Capture Face ({5 - capturedCount} remaining)
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">Or upload images</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing || capturedCount >= 5}
              className="w-full"
            >
              Upload Images
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {capturedCount > 0 && capturedCount < 5 && (
              <p className="text-center text-sm text-gray-500">
                {capturedCount} sample{capturedCount > 1 ? "s" : ""} captured.
                Capture {5 - capturedCount} more for better accuracy.
              </p>
            )}

            {capturedCount >= 5 && (
              <Button
                onClick={() => setCurrentStep("confirm")}
                variant="default"
                className="w-full"
              >
                Proceed to Confirm
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Confirm Step */}
      {currentStep === "confirm" && (
        <Card className="p-6">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900">
            Confirm Registration
          </h2>

          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-3 font-semibold text-gray-900">Student Details</h3>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Roll Number:</span>
                  <span className="font-medium text-gray-900">{studentData.rollNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium text-gray-900">
                    {studentData.firstName} {studentData.lastName}
                  </span>
                </div>
                {studentData.email && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium text-gray-900">{studentData.email}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Face Samples:</span>
                  <span className="font-medium text-green-600">
                    {capturedCount} captured ✓
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Encoding Vectors:</span>
                  <span className="font-medium text-green-600">
                    {encodedFaces.length} ready ✓
                  </span>
                </div>
              </div>
            </div>

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Student registered successfully! Redirecting...
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleRetakePhotos}
                variant="outline"
                className="flex-1"
                disabled={isProcessing || success}
              >
                Retake Photos
              </Button>
              <Button
                onClick={handleConfirmRegistration}
                disabled={isProcessing || success || encodedFaces.length === 0}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirm & Register
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}