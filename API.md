# API Documentation

Complete API reference for the Face Recognition Attendance System.

## Base URLs

- **Frontend API**: `http://localhost:3000/api` (or your Vercel domain)
- **Python Backend**: `http://localhost:8000` (or your API domain)

## Authentication

Currently, the API is unauthenticated. For production, implement authentication before deployment.

## Content Types

All requests and responses use `application/json` unless otherwise noted.

---

## Students API

### List All Students

```http
GET /api/students
```

**Response:**
```json
[
  {
    "id": 1,
    "rollNumber": "CSE001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "faceEncodingPath": "encodings/1.json",
    "registeredAt": "2024-03-24T10:00:00.000Z"
  }
]
```

### Create Student

```http
POST /api/students
Content-Type: application/json

{
  "rollNumber": "CSE001",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phoneNumber": "+1234567890"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "rollNumber": "CSE001",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phoneNumber": "+1234567890",
  "faceEncodingPath": null,
  "registeredAt": "2024-03-24T10:00:00.000Z",
  "updatedAt": "2024-03-24T10:00:00.000Z"
}
```

**Error (409 Conflict):**
```json
{
  "error": "Student with this roll number already exists"
}
```

### Get Student

```http
GET /api/students/1
```

**Response:**
```json
{
  "id": 1,
  "rollNumber": "CSE001",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phoneNumber": "+1234567890",
  "faceEncodingPath": "encodings/1.json",
  "registeredAt": "2024-03-24T10:00:00.000Z",
  "updatedAt": "2024-03-24T10:00:00.000Z",
  "attendanceRecords": [
    {
      "date": "2024-03-24",
      "checkInTime": "2024-03-24T09:30:00.000Z",
      "confidence": 0.95
    }
  ]
}
```

### Update Student

```http
PUT /api/students/1
Content-Type: application/json

{
  "firstName": "Jane",
  "email": "jane@example.com",
  "faceEncodingPath": "encodings/1.json"
}
```

**Response:**
```json
{
  "id": 1,
  "rollNumber": "CSE001",
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "phoneNumber": "+1234567890",
  "faceEncodingPath": "encodings/1.json",
  "registeredAt": "2024-03-24T10:00:00.000Z",
  "updatedAt": "2024-03-24T10:15:00.000Z"
}
```

### Delete Student

```http
DELETE /api/students/1
```

**Response (200 OK):**
```json
{
  "success": true
}
```

**Error (404 Not Found):**
```json
{
  "error": "Student not found"
}
```

---

## Attendance API

### Get Attendance Records

Query parameters:
- `date` (optional): ISO date string (YYYY-MM-DD)
- `studentId` (optional): Student ID

```http
GET /api/attendance?date=2024-03-24&studentId=1
```

**Response:**
```json
[
  {
    "id": 1,
    "studentId": 1,
    "date": "2024-03-24",
    "checkInTime": "2024-03-24T09:30:00.000Z",
    "confidence": 0.95,
    "student": {
      "id": 1,
      "rollNumber": "CSE001",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
]
```

### Record Attendance

```http
POST /api/attendance
Content-Type: application/json

{
  "studentId": 1,
  "confidence": 0.95
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "studentId": 1,
  "date": "2024-03-24",
  "checkInTime": "2024-03-24T09:30:00.000Z",
  "confidence": 0.95,
  "student": {
    "rollNumber": "CSE001",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Error (409 Conflict):**
```json
{
  "error": "Student already marked present today"
}
```

**Error (404 Not Found):**
```json
{
  "error": "Student not found"
}
```

---

## Face Recognition API

### Encode Face

Encodes a single face from a base64-encoded image.

```http
POST /api/face/encode
Content-Type: application/json

{
  "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response (Success):**
```json
{
  "success": true,
  "encoding": [0.123, -0.456, 0.789, ...],
  "face_count": 1
}
```

**Response (No Face Detected):**
```json
{
  "success": false,
  "face_count": 0,
  "error": "No faces detected in the image"
}
```

**Response (Multiple Faces):**
```json
{
  "success": false,
  "face_count": 2,
  "error": "Multiple faces detected. Please ensure only one face is in the image"
}
```

### Recognize Face

Compares a test image against stored face encodings.

```http
POST /api/face/recognize
Content-Type: application/json

{
  "testImageData": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "storedEncodings": [
    [0.123, -0.456, 0.789, ...],
    [0.234, -0.567, 0.890, ...]
  ]
}
```

**Response (Face Recognized):**
```json
{
  "recognized": true,
  "confidence": 0.95
}
```

**Response (Face Not Recognized):**
```json
{
  "recognized": false,
  "confidence": 0.42
}
```

**Response (No Face in Test Image):**
```json
{
  "recognized": false,
  "error": "No faces detected in the image"
}
```

---

## Python Backend API

### Health Check

```http
GET http://localhost:8000/health
```

**Response:**
```json
{
  "status": "ok",
  "service": "face-recognition"
}
```

### Encode (Direct)

```http
POST http://localhost:8000/encode
Content-Type: application/json

{
  "image_data": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response:**
```json
{
  "success": true,
  "encoding": [0.123, -0.456, 0.789, ...],
  "face_count": 1,
  "error": null
}
```

### Recognize (Direct)

```http
POST http://localhost:8000/recognize
Content-Type: application/json

{
  "test_image_data": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "stored_encodings": [
    [0.123, -0.456, 0.789, ...],
    [0.234, -0.567, 0.890, ...]
  ]
}
```

**Response:**
```json
{
  "recognized": true,
  "confidence": 0.95,
  "error": null
}
```

### Batch Encode

```http
POST http://localhost:8000/batch-encode
Content-Type: multipart/form-data

files: [file1.jpg, file2.jpg, file3.jpg, ...]
```

**Response:**
```json
{
  "success": true,
  "encodings": [
    [0.123, -0.456, 0.789, ...],
    [0.234, -0.567, 0.890, ...],
    [0.345, -0.678, 0.901, ...]
  ],
  "count": 3,
  "errors": []
}
```

**Response (Some Errors):**
```json
{
  "success": true,
  "encodings": [
    [0.123, -0.456, 0.789, ...]
  ],
  "count": 1,
  "errors": [
    "File 2: Multiple faces detected",
    "File 3: Could not decode image"
  ]
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "Missing required field: studentId"
}
```

### 404 Not Found

```json
{
  "error": "Student not found"
}
```

### 409 Conflict

```json
{
  "error": "Student already marked present today"
}
```

### 500 Internal Server Error

```json
{
  "error": "Failed to process request"
}
```

---

## Data Types

### Student Object

```json
{
  "id": 1,
  "rollNumber": "CSE001",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phoneNumber": "+1234567890",
  "faceEncodingPath": "encodings/1.json",
  "registeredAt": "2024-03-24T10:00:00.000Z"
}
```

### Attendance Object

```json
{
  "id": 1,
  "studentId": 1,
  "date": "2024-03-24",
  "checkInTime": "2024-03-24T09:30:00.000Z",
  "confidence": 0.95,
  "createdAt": "2024-03-24T09:30:00.000Z"
}
```

### Face Encoding

Array of 128 floating-point numbers representing the face encoding.

```json
[0.123, -0.456, 0.789, -0.234, ...]  // 128 values
```

---

## Rate Limiting

Currently no rate limiting is implemented. For production, consider:
- 100 requests per minute per IP
- 10 requests per second for face recognition
- 1000 requests per hour for API routes

## CORS

Configured to allow requests from:
- `http://localhost:3000`
- `http://localhost:3001`

Update in `python/main.py` for production domains.

## Image Format

Accepted image formats:
- JPEG
- PNG
- WebP

Maximum size: 5MB (enforced by browser)

Base64 encoding format: `data:image/jpeg;base64,<encoded-data>`

## Confidence Threshold

- **Range**: 0.0 to 1.0
- **Default**: 0.6
- **Recommendation**: 0.6 for balanced accuracy
- **Strict**: 0.65+ (fewer false positives)
- **Lenient**: 0.55- (more matches)

Adjust in `.env.local` and `python/.env`.

## Pagination

Not currently implemented. For large datasets, implement:

```http
GET /api/attendance?page=1&limit=50&date=2024-03-24
```

## Filtering

Currently supported:
- By date: `?date=YYYY-MM-DD`
- By studentId: `?studentId=1`
- By search term: (client-side in components)

## Sorting

Not currently implemented. Could add:

```http
GET /api/attendance?sort=checkInTime&order=desc
```

## Testing API

### Using cURL

```bash
# List students
curl http://localhost:3000/api/students

# Create student
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{"rollNumber":"TEST001","firstName":"Test","lastName":"User"}'

# Get attendance
curl "http://localhost:3000/api/attendance?date=2024-03-24"
```

### Using Postman

1. Import the URLs into Postman
2. Set Content-Type to application/json
3. Use the request examples above
4. Test with different parameters

### Using Thunder Client

VS Code extension for API testing:

```http
### List Students
GET http://localhost:3000/api/students

### Create Student
POST http://localhost:3000/api/students
Content-Type: application/json

{
  "rollNumber": "TEST001",
  "firstName": "Test",
  "lastName": "User"
}
```

---

## API Versioning

Current API version: v1 (no prefix)

For future versions, use `/api/v2/...`

---

## Changelog

### v1.0 (Current)
- Students CRUD
- Attendance tracking
- Face encoding/recognition
- Records filtering
- CSV export (frontend only)

### Future
- Authentication/Authorization
- Rate limiting
- Pagination
- Advanced filtering
- Batch operations
- Webhooks
- Analytics endpoints

---

## Support

For API issues:
1. Check this documentation
2. Review error messages
3. Check browser console (F12)
4. Review Python server logs
5. Check `.env.local` configuration
