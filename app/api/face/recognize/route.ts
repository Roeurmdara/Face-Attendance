import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/face/recognize
 * Bridge endpoint to recognize faces using Python FastAPI backend
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testImageData, storedEncodings } = body;

    if (!testImageData || !storedEncodings) {
      return NextResponse.json(
        { error: "testImageData and storedEncodings are required" },
        { status: 400 }
      );
    }

    const pythonApiUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL;

    if (!pythonApiUrl) {
      return NextResponse.json(
        { error: "Python API URL not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(`${pythonApiUrl}/recognize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        test_image_data: testImageData,
        stored_encodings: storedEncodings,
      }),
    });

    if (!response.ok) {
      throw new Error(`Python API returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error recognizing face:", error);
    return NextResponse.json(
      { error: "Failed to recognize face" },
      { status: 500 }
    );
  }
}
