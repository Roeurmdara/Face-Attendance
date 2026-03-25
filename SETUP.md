# Quick Start Guide

Follow these steps to get the Face Recognition Attendance System running locally.

## Prerequisites

- Node.js 18+ (download from https://nodejs.org)
- Python 3.8+ (download from https://www.python.org)
- PostgreSQL 12+ (download from https://www.postgresql.org)
- Git

## Step 1: Clone & Install Dependencies

```bash
# Install Node dependencies
npm install
```

## Step 2: Database Setup

### Create Database

```bash
# Using psql or your PostgreSQL client
createdb attendance_db
```

### Configure Environment

Create `.env.local` in project root:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/attendance_db"
NEXT_PUBLIC_PYTHON_API_URL="http://localhost:8000"
NEXT_PUBLIC_FACE_RECOGNITION_THRESHOLD="0.6"
```

Replace `postgres` and `password` with your PostgreSQL credentials.

### Run Migrations

```bash
npx prisma migrate deploy
```

## Step 3: Python Backend Setup

### Install Python Dependencies

```bash
cd python
pip install -r requirements.txt
```

### Start FastAPI Server

```bash
python main.py
```

You should see:
```
Uvicorn running on http://0.0.0.0:8000
```

**Keep this terminal open - the Python backend must be running!**

## Step 4: Start Next.js Frontend

### In a NEW terminal window:

```bash
npm run dev
```

You should see:
```
▲ Next.js 16.2.0
- Local:        http://localhost:3000
```

## Step 5: Access the Application

Open your browser and go to:
```
http://localhost:3000
```

## Quick Navigation

- **Home**: `http://localhost:3000` - Overview and features
- **Register**: `http://localhost:3000/register` - Add new students
- **Attendance**: `http://localhost:3000/attendance` - Mark attendance
- **Records**: `http://localhost:3000/records` - View attendance history
- **Admin**: `http://localhost:3000/admin` - Manage students

## Testing the System

### Test 1: Register a Student

1. Go to `/register`
2. Enter test data:
   - Roll Number: `TEST001`
   - First Name: `John`
   - Last Name: `Doe`
3. Capture 5 face samples or upload images
4. Click "Confirm & Register"

### Test 2: Mark Attendance

1. Go to `/attendance`
2. Click "Start Attendance"
3. Show your face to the camera
4. The system should recognize you after a few seconds

### Test 3: View Records

1. Go to `/records`
2. View today's attendance
3. Export CSV for further analysis

## Troubleshooting

### "ModuleNotFoundError" when running Python

```bash
cd python
pip install -r requirements.txt
```

### "connection refused" error

Make sure both servers are running:
- Python backend: `http://localhost:8000` (should show health endpoint)
- Next.js frontend: `http://localhost:3000`

### Camera permission denied

- Check browser permissions (camera icon in address bar)
- Make sure no other application is using the camera
- Try a different browser (Chrome, Edge, Firefox)

### Database connection error

Verify `.env.local` has correct DATABASE_URL:
```bash
# Test connection with psql
psql postgresql://postgres:password@localhost:5432/attendance_db
```

### "CORS" error in console

Ensure Python API is running and `NEXT_PUBLIC_PYTHON_API_URL` matches the actual URL.

## Stopping the Application

1. Stop Python server: Press `Ctrl+C` in the Python terminal
2. Stop Next.js: Press `Ctrl+C` in the Next.js terminal

## Next Steps

1. Configure face recognition threshold in `.env.local`
2. Set up admin authentication (recommended for production)
3. Configure email notifications
4. Deploy to production (see README.md for deployment options)

## File Structure Reference

```
project/
├── app/                 # Next.js pages and API routes
├── components/          # React components
├── lib/                # Utilities and helpers
├── hooks/              # Custom React hooks
├── prisma/             # Database schema
├── python/             # FastAPI backend
├── .env.local          # Local environment variables
├── README.md           # Full documentation
└── SETUP.md            # This file
```

## Need Help?

- Check README.md for full documentation
- Review error messages in browser console (F12)
- Check Python server terminal for API errors
- Verify all environment variables are set correctly

Good luck!
