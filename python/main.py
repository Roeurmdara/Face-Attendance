"""
Face Recognition FastAPI Backend
Handles face encoding, recognition, and comparison
Uses DeepFace instead of face_recognition (no dlib/cmake required)
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import cv2
from io import BytesIO
import base64
from typing import List
import os
from dotenv import load_dotenv
from deepface import DeepFace

load_dotenv()

app = FastAPI(title="Face Recognition API")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model to use for face recognition (Facenet is fast and accurate)
MODEL_NAME = "Facenet"
DETECTOR = "opencv"


class FaceEncodingRequest(BaseModel):
    """Request model for encoding faces"""
    image_data: str  # base64 encoded image


class FaceRecognitionRequest(BaseModel):
    """Request model for recognizing faces"""
    test_image_data: str  # base64 encoded test image
    stored_encodings: List[List[float]]  # list of stored face encodings


class FaceEncodingResponse(BaseModel):
    """Response model for face encoding"""
    success: bool
    encoding: List[float] | None = None
    face_count: int = 0
    error: str | None = None


class FaceRecognitionResponse(BaseModel):
    """Response model for face recognition"""
    recognized: bool
    confidence: float = 0.0
    error: str | None = None


def decode_image_from_base64(image_data: str):
    """Decode base64 image string to OpenCV format"""
    try:
        if "," in image_data:
            image_data = image_data.split(",")[1]

        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            raise ValueError("Failed to decode image")

        return image
    except Exception as e:
        raise ValueError(f"Error decoding image: {str(e)}")


def get_face_embedding(image: np.ndarray) -> tuple:
    """
    Get face embedding using DeepFace.
    Returns (embedding, face_count) or raises an exception.
    """
    try:
        # DeepFace expects RGB image
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # Extract faces first to count them
        faces = DeepFace.extract_faces(
            img_path=rgb_image,
            detector_backend=DETECTOR,
            enforce_detection=True
        )

        face_count = len(faces)

        if face_count == 0:
            return None, 0

        if face_count > 1:
            return None, face_count

        # Get embedding
        result = DeepFace.represent(
            img_path=rgb_image,
            model_name=MODEL_NAME,
            detector_backend=DETECTOR,
            enforce_detection=True
        )

        embedding = result[0]["embedding"]
        return embedding, 1

    except Exception as e:
        error_msg = str(e)
        if "Face could not be detected" in error_msg:
            return None, 0
        raise


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "face-recognition"}


@app.post("/encode", response_model=FaceEncodingResponse)
async def encode_face(request: FaceEncodingRequest):
    """
    Encode a face from an image.
    Returns the face encoding as a list of floats.
    """
    try:
        image = decode_image_from_base64(request.image_data)
        embedding, face_count = get_face_embedding(image)

        if face_count == 0:
            return FaceEncodingResponse(
                success=False,
                face_count=0,
                error="No faces detected in the image"
            )

        if face_count > 1:
            return FaceEncodingResponse(
                success=False,
                face_count=face_count,
                error="Multiple faces detected. Please ensure only one face is in the image"
            )

        return FaceEncodingResponse(
            success=True,
            encoding=embedding,
            face_count=1
        )

    except Exception as e:
        return FaceEncodingResponse(
            success=False,
            error=f"Error processing image: {str(e)}"
        )


@app.post("/recognize", response_model=FaceRecognitionResponse)
async def recognize_face(request: FaceRecognitionRequest):
    """
    Recognize a face by comparing against stored encodings.
    Returns whether face is recognized and confidence score.
    """
    try:
        test_image = decode_image_from_base64(request.test_image_data)
        test_embedding, face_count = get_face_embedding(test_image)

        if face_count == 0 or test_embedding is None:
            return FaceRecognitionResponse(
                recognized=False,
                error="No faces detected in the image"
            )

        # Convert to numpy array
        test_vec = np.array(test_embedding)

        # Compare with stored encodings using cosine similarity
        threshold = float(os.getenv("FACE_RECOGNITION_THRESHOLD", "0.6"))
        best_similarity = 0.0

        for stored_enc in request.stored_encodings:
            stored_vec = np.array(stored_enc)

            # Cosine similarity
            dot = np.dot(test_vec, stored_vec)
            norm = np.linalg.norm(test_vec) * np.linalg.norm(stored_vec)
            similarity = dot / norm if norm > 0 else 0.0

            if similarity > best_similarity:
                best_similarity = similarity

        # Threshold: similarity above 0.7 is typically a match for Facenet
        facenet_threshold = 0.7
        recognized = best_similarity >= facenet_threshold
        confidence = float(max(0, min(1, best_similarity)))

        return FaceRecognitionResponse(
            recognized=recognized,
            confidence=confidence
        )

    except Exception as e:
        return FaceRecognitionResponse(
            recognized=False,
            error=f"Error during recognition: {str(e)}"
        )


@app.post("/batch-encode")
async def batch_encode_faces(files: List[UploadFile] = File(...)):
    """
    Encode multiple face images at once.
    Used for student registration with multiple images.
    """
    try:
        encodings = []
        errors = []

        for idx, file in enumerate(files):
            try:
                contents = await file.read()
                nparr = np.frombuffer(contents, np.uint8)
                image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                if image is None:
                    errors.append(f"File {idx + 1}: Could not decode image")
                    continue

                embedding, face_count = get_face_embedding(image)

                if face_count == 0:
                    errors.append(f"File {idx + 1}: No face detected")
                elif face_count > 1:
                    errors.append(f"File {idx + 1}: Multiple faces detected ({face_count})")
                elif embedding is not None:
                    encodings.append(embedding)
                else:
                    errors.append(f"File {idx + 1}: Could not encode face")

            except Exception as e:
                errors.append(f"File {idx + 1}: {str(e)}")

        return {
            "success": len(encodings) > 0,
            "encodings": encodings,
            "count": len(encodings),
            "errors": errors
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing files: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)