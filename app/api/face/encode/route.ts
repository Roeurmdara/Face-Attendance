import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/face/encode
 * Bridge endpoint to encode faces using Python FastAPI backend
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageData } = body;

    if (!imageData) {
      return NextResponse.json(
        { error: "imageData is required" },
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

    const response = await fetch(`${pythonApiUrl}/encode`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_data: imageData,
      }),
    });

    if (!response.ok) {
      throw new Error(`Python API returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error encoding face:", error);
    return NextResponse.json(
      { error: "Failed to encode face" },
      { status: 500 }
    );
  }
}
