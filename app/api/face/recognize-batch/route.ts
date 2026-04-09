import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/face/recognize-batch
 * Recognize face against ALL stored encodings in a single call
 * Body: { test_image_data: string, stored_encodings: number[][] }
 * Returns: { recognized: boolean, confidence: number, studentId?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { test_image_data, stored_encodings } = body;

    if (!test_image_data || !stored_encodings || !Array.isArray(stored_encodings)) {
      return NextResponse.json(
        { error: "test_image_data and stored_encodings are required" },
        { status: 400 }
      );
    }

    // Forward to Python API
    const pythonApiUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || "http://localhost:8000";
    
    const response = await fetch(`${pythonApiUrl}/recognize-batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        test_image_data,
        stored_encodings,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || "Face recognition failed" },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in batch recognize:", error);
    return NextResponse.json(
      { error: "Failed to recognize face" },
      { status: 500 }
    );
  }
}
