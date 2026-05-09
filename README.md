# Face Attendance System

A web app for student attendance using face recognition. The project has a Next.js frontend, Next.js API routes, a Python FastAPI face-recognition service, and a PostgreSQL database managed with Prisma.

## Main Features

- Register students with roll number, name, email, phone, and face samples
- Encode face samples and save face data in PostgreSQL
- Mark attendance from a live camera feed
- Prevent duplicate attendance for the same student on the same day
- View, search, filter, and export attendance records
- Manage registered students from the admin page

## Tech Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui
- API: Next.js route handlers
- Face service: Python, FastAPI, OpenCV, DeepFace/face embeddings
- Database: PostgreSQL, Prisma ORM
- Optional local services: Docker Compose

## Project Structure

```text
app/                     Next.js pages and API routes
  api/
    attendance/          Attendance API
    students/            Student API
    face/                Bridge to Python face service
  register/              Student registration page
  attendance/            Live attendance page
  records/               Attendance records page
  admin/                 Student management page
components/              React UI and feature components
hooks/                   Camera and shared React hooks
lib/                     Utility code and face API helpers
prisma/                  Prisma schema and migrations
python/                  FastAPI face-recognition backend
docker-compose.yml       PostgreSQL and Python service setup
Dockerfile.python        Python API Docker image
```

## Requirements

- Node.js 18 or newer
- npm
- Python 3.10 or newer recommended
- PostgreSQL, or Docker Desktop if you want Docker to run PostgreSQL
- A webcam or camera permission in the browser

## Quick Start

Use three terminals: one for the database, one for the Python API, and one for the Next.js app.

### 1. Install Node Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create or update `.env` in the project root:

```env
DATABASE_URL="postgresql://postgres:1234@localhost:5433/face"
NEXT_PUBLIC_PYTHON_API_URL="http://localhost:8000"
NEXT_PUBLIC_FACE_RECOGNITION_THRESHOLD="0.6"
```

Create or update `python/.env`:

```env
FACE_RECOGNITION_THRESHOLD=0.6
```

Important: `DATABASE_URL` must match your PostgreSQL username, password, port, and database name.

### 3. Start PostgreSQL

If you already have PostgreSQL running locally, create the database used in `.env`.

Example for the current local setup:

```bash
createdb -U postgres -p 5433 face
```

If you want to use Docker Compose instead:

```bash
docker compose up -d postgres
```

The Docker Compose database uses this connection string:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/attendance_db"
```

Use either your local PostgreSQL setup or Docker Compose, then make sure `.env` matches the one you chose.

### 4. Run Prisma Migrations

```bash
npx prisma generate
npx prisma migrate deploy
```

For development, you can also use:

```bash
npx prisma migrate dev
```

### 5. Start the Python Face API

```bash
cd python
pip install -r requirements.txt
python main.py
```

The Python API should run at:

```text
http://localhost:8000
```

Check it with:

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{"status":"ok","service":"face-recognition"}
```

### 6. Start the Next.js App

Open a new terminal in the project root:

```bash
npm run dev
```

Open the app:

```text
http://localhost:3000
```

## App Pages

- Home: `http://localhost:3000`
- Register student: `http://localhost:3000/register`
- Mark attendance: `http://localhost:3000/attendance`
- View records: `http://localhost:3000/records`
- Admin dashboard: `http://localhost:3000/admin`

## How to Use

### Register a Student

1. Open `/register`.
2. Enter the student information.
3. Capture or upload clear face samples.
4. Submit the form.
5. The app sends the images to the Python API, receives face encodings, and saves the student in PostgreSQL.

### Mark Attendance

1. Open `/attendance`.
2. Allow camera permission in the browser.
3. Start attendance.
4. The app compares the camera image with stored face encodings.
5. When a student is recognized, the app saves attendance for today.

### View Records

1. Open `/records`.
2. Search or filter attendance records.
3. Export records if needed.

### Manage Students

1. Open `/admin`.
2. View registered students.
3. Search students or delete records when needed.

## API Routes

### Next.js API

```text
GET    /api/students
POST   /api/students
GET    /api/students/[id]
PUT    /api/students/[id]
DELETE /api/students/[id]

GET    /api/attendance
POST   /api/attendance

POST   /api/face/encode
POST   /api/face/recognize
POST   /api/face/recognize-batch
```

### Python API

```text
GET  /health
POST /encode
POST /recognize
POST /recognize-batch
POST /batch-encode
```

## Useful Commands

```bash
# Start frontend
npm run dev

# Build frontend
npm run build

# Run lint
npm run lint

# Generate Prisma client
npx prisma generate

# Apply existing migrations
npx prisma migrate deploy

# Create/apply a development migration
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio

# Start Docker database only
docker compose up -d postgres

# Start Docker database and Python API
docker compose up -d postgres python-api
```

## Troubleshooting

### Database Connection Error

- Check that PostgreSQL is running.
- Check that `.env` has the correct `DATABASE_URL`.
- Make sure the database exists.
- Run `npx prisma generate` and `npx prisma migrate deploy`.

### Python API Not Responding

- Make sure `python main.py` is running.
- Open `http://localhost:8000/health`.
- Check that `NEXT_PUBLIC_PYTHON_API_URL` is `http://localhost:8000`.
- Restart the Next.js app after changing environment variables.

### Python Dependency Error

- Run the install command again from the `python/` folder:

```bash
pip install -r requirements.txt
```

- If an error says a package is missing, install the missing package and add it to `python/requirements.txt`.

### Camera Not Working

- Allow camera permission in the browser.
- Close other apps that may be using the camera.
- Try Chrome or Edge.
- Use good lighting and keep one face clearly visible.

### No Face Detected

- Use a brighter room.
- Face the camera directly.
- Keep the whole face inside the frame.
- Avoid multiple faces in one image.
- Try uploading clearer images during registration.

### Face Not Recognized

- Register the student again with better face samples.
- Keep lighting similar between registration and attendance.
- Adjust the threshold in `.env` and `python/.env`.

Recommended threshold:

```env
NEXT_PUBLIC_FACE_RECOGNITION_THRESHOLD="0.6"
FACE_RECOGNITION_THRESHOLD=0.6
```

## Production Notes

Before using this in production:

- Add authentication for admin and API routes
- Use HTTPS
- Use a managed PostgreSQL database
- Protect environment variables
- Add rate limiting for face-recognition endpoints
- Review how face data is stored and secured
- Update CORS origins in `python/main.py`

## More Documentation

- `SETUP.md` has another quick setup guide.
- `API.md` has detailed API examples.
- `ENV_CONFIG.md` explains environment variables.
- `DEVELOPER_GUIDE.md` has extra developer notes.
