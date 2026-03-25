# Face Recognition Attendance System

A full-stack application for automated attendance tracking using facial recognition technology. Built with Next.js, Python FastAPI, PostgreSQL, and Prisma ORM.

## Overview

This system provides:
- **Student Registration**: Capture and encode facial data during registration
- **Live Attendance**: Real-time face recognition for automatic attendance marking
- **Records Management**: View attendance history with confidence scores
- **Admin Dashboard**: Manage students and system settings

## Technology Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - UI styling
- **shadcn/ui** - Component library
- **Lucide Icons** - Icon system

### Backend
- **Python FastAPI** - Face recognition API
- **face_recognition** - Deep learning face recognition
- **OpenCV** - Image processing
- **NumPy** - Numerical computations

### Database
- **PostgreSQL** - Relational database
- **Prisma ORM** - Database client and migrations

## Project Structure

```
.
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── students/            # Student management
│   │   ├── attendance/          # Attendance tracking
│   │   └── face/                # Face recognition endpoints
│   ├── register/                # Student registration
│   ├── attendance/              # Mark attendance
│   ├── records/                 # View attendance records
│   └── admin/                   # Admin dashboard
├── components/
│   ├── registration/            # Registration components
│   ├── attendance/              # Attendance components
│   ├── records/                 # Records components
│   └── admin/                   # Admin components
├── lib/
│   └── face-recognition.ts      # Face recognition utilities
├── hooks/
│   └── use-camera.ts            # Camera access hook
├── prisma/
│   └── schema.prisma            # Database schema
├── python/
│   ├── main.py                  # FastAPI application
│   └── requirements.txt         # Python dependencies
└── public/                      # Static files
```

## Prerequisites

- Node.js 18+ and npm/pnpm
- Python 3.8+
- PostgreSQL 12+
- Webcam/camera for face capture

## Installation & Setup

### 1. Environment Variables

Create `.env.local` in the project root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/attendance_db"

# Python API
NEXT_PUBLIC_PYTHON_API_URL="http://localhost:8000"

# Face Recognition Threshold (0-1)
NEXT_PUBLIC_FACE_RECOGNITION_THRESHOLD="0.6"
```

### 2. Database Setup

Install dependencies and run migrations:

```bash
npm install

# Run Prisma migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

The database schema includes:
- **students** table: Student information and face encoding paths
- **attendance** table: Attendance records with timestamps and confidence scores

### 3. Python Backend Setup

Set up the face recognition API:

```bash
cd python

# Install dependencies
pip install -r requirements.txt

# Run FastAPI server
python main.py
```

The server will start on `http://localhost:8000` with endpoints:
- `POST /encode` - Encode face from image
- `POST /recognize` - Recognize face against stored encodings
- `POST /batch-encode` - Encode multiple images at once
- `GET /health` - Health check

### 4. Frontend Setup

Start the Next.js development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage

### 1. Register a Student

1. Go to `/register`
2. Enter student details (roll number, name, email, phone)
3. Capture 5 face samples using the camera or upload images
4. Confirm and complete registration

Face encodings are stored in the database and used for attendance recognition.

### 2. Mark Attendance

1. Go to `/attendance`
2. Click "Start Attendance"
3. The system continuously captures frames and recognizes faces
4. Recognized students are automatically marked present
5. Click "Stop Attendance" to end the session

The system records:
- Student ID
- Check-in timestamp
- Recognition confidence score (0-1)

### 3. View Records

1. Go to `/records`
2. Filter by date or search for specific students
3. View attendance history with confidence scores
4. Export records as CSV

### 4. Admin Dashboard

1. Go to `/admin`
2. View all registered students
3. See registration status and face encoding status
4. Search and filter students
5. Delete students if needed
6. View statistics (total students, today's registrations, recognized faces)

## API Documentation

### Student Endpoints

```
GET /api/students                    # Get all students
POST /api/students                   # Create new student
GET /api/students/[id]              # Get specific student
PUT /api/students/[id]              # Update student
DELETE /api/students/[id]           # Delete student
```

### Attendance Endpoints

```
GET /api/attendance                  # Get attendance records (filterable by date/studentId)
POST /api/attendance                 # Record attendance
```

### Face Recognition Endpoints (via Next.js bridge)

```
POST /api/face/encode               # Encode face from image
POST /api/face/recognize            # Recognize face against stored encodings
```

## Configuration

### Face Recognition Threshold

Adjust the confidence threshold in `.env.local`:

```env
NEXT_PUBLIC_FACE_RECOGNITION_THRESHOLD="0.6"  # 0-1 scale, lower = stricter
```

- **0.6**: Strict (recommended for security)
- **0.65**: Balanced
- **0.7**: Lenient (more recognitions but may have false positives)

### Python Backend Settings

Edit `python/.env`:

```env
FACE_RECOGNITION_THRESHOLD=0.6
```

## Development

### Running Tests

```bash
# Frontend
npm run lint

# Python
cd python && python -m pytest
```

### Database Migrations

Create a new migration:

```bash
npx prisma migrate dev --name <migration_name>
```

View and manage migrations in `prisma/migrations/`

## Deployment

### Frontend (Vercel)

```bash
npm run build
vercel deploy
```

### Python Backend

Deploy the FastAPI application using:
- Docker + Cloud Run
- Railway.app
- Render.com
- Self-hosted server

Example Docker setup:

```dockerfile
FROM python:3.11
WORKDIR /app
COPY python/requirements.txt .
RUN pip install -r requirements.txt
COPY python . 
CMD ["python", "main.py"]
```

### Database

Use managed PostgreSQL services:
- AWS RDS
- Google Cloud SQL
- Heroku PostgreSQL
- Neon

## Troubleshooting

### "No faces detected"
- Ensure good lighting
- Position face directly towards camera
- Keep face fully visible
- Try uploading images instead of camera capture

### "Face recognition confidence too low"
- Adjust threshold in `.env.local`
- Re-register student with better quality images
- Ensure consistent lighting conditions

### "Camera not accessible"
- Check browser permissions for camera access
- Ensure camera is not in use by another application
- Try a different browser
- Check HTTPS requirement (some browsers require it)

### "Database connection error"
- Verify DATABASE_URL in `.env.local`
- Check PostgreSQL server is running
- Ensure database exists
- Run migrations: `npx prisma migrate deploy`

### "Python API not responding"
- Check NEXT_PUBLIC_PYTHON_API_URL is correct
- Ensure Python server is running on port 8000
- Check CORS configuration in FastAPI
- Verify firewall allows connections

## Performance Tips

1. **Image Quality**: Use images ≥ 640x480px for better recognition
2. **Lighting**: Ensure consistent, adequate lighting
3. **Face Size**: Position face to occupy 30-50% of image
4. **Batch Processing**: Use batch-encode endpoint for multiple registrations
5. **Database**: Add indexes on frequently queried columns (already configured)

## Security Considerations

1. **Face Data**: Encodings are stored as JSON, consider encryption at rest
2. **API Authentication**: Add authentication middleware for production
3. **Rate Limiting**: Implement rate limiting on API endpoints
4. **HTTPS**: Use HTTPS in production
5. **Environment Variables**: Never commit `.env.local` to version control

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check database schema in `prisma/schema.prisma`
4. Review FastAPI logs in `python/main.py`

## Future Enhancements

- [ ] Multi-face detection and handling
- [ ] Real-time attendance dashboard
- [ ] Email notifications
- [ ] Student mobile app
- [ ] Advanced analytics and reporting
- [ ] Machine learning model fine-tuning
- [ ] Biometric temperature integration
- [ ] QR code backup attendance
