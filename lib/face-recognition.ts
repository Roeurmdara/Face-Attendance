/**
 * Face Recognition Utility Functions
 * Handles communication with face recognition backend
 */

export interface FaceEncodingResponse {
  success: boolean;
  encoding?: number[];
  face_count?: number;
  error?: string;
}

export interface FaceRecognitionResponse {
  recognized: boolean;
  confidence?: number;
  error?: string;
}

/**
 * Convert image file to base64 string
 */
export async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Encode a face from image data
 */
export async function encodeFace(imageData: string): Promise<FaceEncodingResponse> {
  try {
    const response = await fetch("/api/face/encode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageData }),
    });

    if (!response.ok) {
      throw new Error("Failed to encode face");
    }

    return await response.json();
  } catch (error) {
    console.error("Error encoding face:", error);
    return {
      success: false,
      error: "Failed to encode face",
    };
  }
}

/**
 * Recognize a face from image data against stored encodings
 */
export async function recognizeFace(
  testImageData: string,
  storedEncodings: number[][]
): Promise<FaceRecognitionResponse> {
  try {
    const response = await fetch("/api/face/recognize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        testImageData,
        storedEncodings,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to recognize face");
    }

    return await response.json();
  } catch (error) {
    console.error("Error recognizing face:", error);
    return {
      recognized: false,
      error: "Failed to recognize face",
    };
  }
}

/**
 * Parse face encodings from JSON string
 */
export function parseEncodings(encodingJson: string): number[][] {
  try {
    const parsed = JSON.parse(encodingJson);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

/**
 * Convert camera frame to base64 image
 */
export async function canvasToBase64(canvas: HTMLCanvasElement): Promise<string> {
  return canvas.toDataURL("image/jpeg", 0.95);
}

/**
 * Confidence percentage from confidence score
 */
export function getConfidencePercentage(confidence: number): number {
  return Math.round(confidence * 100);
}
