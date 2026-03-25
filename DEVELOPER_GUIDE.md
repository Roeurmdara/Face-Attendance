# Developer Guide

Quick reference for developers working on the Face Recognition Attendance System.

## Project Setup

```bash
# Install dependencies
npm install

# Create database
createdb attendance_db

# Setup environment
cp .env.example .env.local
# Edit .env.local with your settings

# Run migrations
npx prisma migrate deploy

# Start development servers
# Terminal 1 - Python backend
cd python && python main.py

# Terminal 2 - Next.js frontend
npm run dev
```

## Development Workflow

### Adding New Database Fields

1. Edit `prisma/schema.prisma`
2. Create migration: `npx prisma migrate dev --name add_field_name`
3. Update TypeScript types
4. Regenerate client: `npx prisma generate`

### Adding New API Endpoint

1. Create route file: `app/api/route-name/route.ts`
2. Export handler: `export async function GET/POST(request: NextRequest)`
3. Add database logic using PrismaClient
4. Test with curl or API client

### Adding New Frontend Page

1. Create directory: `app/new-page/`
2. Create `page.tsx` with exported component
3. Create component in `components/` folder
4. Add to navigation
5. Style with Tailwind CSS

### Modifying Face Recognition

1. Adjust threshold in `.env.local`: `NEXT_PUBLIC_FACE_RECOGNITION_THRESHOLD`
2. Modify Python logic in `python/main.py` if needed
3. Test with different lighting/face angles

## Common Tasks

### Run Database Migrations

```bash
# Create new migration
npx prisma migrate dev --name describe_change

# Deploy migrations to production
npx prisma migrate deploy

# Reset database (CAREFUL - deletes all data)
npx prisma migrate reset
```

### View Database

```bash
# Open Prisma Studio
npx prisma studio

# Or use psql
psql -d attendance_db
SELECT * FROM students;
```

### Debugging

```bash
# View Next.js logs
npm run dev

# View Python logs
cd python && python main.py

# Check camera access
# Browser console: check permissions in DevTools

# API testing
curl http://localhost:3000/api/students
curl http://localhost:8000/health
```

### Deploy Changes

```bash
# Test build
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Check for linting issues
npm run lint
```

## Code Organization

### API Routes (`app/api/`)
- Student CRUD: `students/route.ts`, `students/[id]/route.ts`
- Attendance: `attendance/route.ts`
- Face operations: `face/encode/route.ts`, `face/recognize/route.ts`

### Components (`components/`)
- Registration: `registration/student-registration-form.tsx`
- Attendance: `attendance/live-attendance-form.tsx`
- Records: `records/attendance-records.tsx`
- Admin: `admin/student-management.tsx`

### Utilities (`lib/`)
- Face recognition: `face-recognition.ts`

### Hooks (`hooks/`)
- Camera access: `use-camera.ts`

## Common Code Patterns

### Fetch from API

```typescript
const response = await fetch('/api/students');
const data = await response.json();
```

### Make API Request from Route

```typescript
const prisma = new PrismaClient();
const students = await prisma.student.findMany();
await prisma.$disconnect();
return NextResponse.json(students);
```

### Camera Hook

```typescript
const { videoRef, captureFrame, startCamera, stopCamera } = useCamera();

// Start camera
await startCamera();

// Capture frame
const imageData = captureFrame();

// Stop camera
stopCamera();
```

### Face Encoding

```typescript
import { encodeFace } from '@/lib/face-recognition';

const result = await encodeFace(imageData);
if (result.success && result.encoding) {
  console.log('Face encoded:', result.encoding);
}
```

## Testing

### Manual Testing Checklist

- [ ] Register student successfully
- [ ] Capture 5 face samples
- [ ] Mark attendance via face recognition
- [ ] View attendance records
- [ ] Filter records by date
- [ ] Export records as CSV
- [ ] Delete student from admin
- [ ] Search students by name
- [ ] Update student info
- [ ] Camera permissions work

### Quick Test

```bash
# Test database
npx prisma db seed

# Test API
curl http://localhost:3000/api/students

# Test Python backend
curl http://localhost:8000/health
```

## Troubleshooting for Developers

### "Module not found"
```bash
npm install
npx prisma generate
```

### "Can't connect to database"
```bash
# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL
```

### "Python module not found"
```bash
cd python
pip install -r requirements.txt
```

### "Face not detected"
- Check lighting
- Ensure face is 30-50% of image
- Try different angle/distance
- Check camera quality

### "CORS error"
- Verify Python server is running
- Check `NEXT_PUBLIC_PYTHON_API_URL`
- Verify CORS in `python/main.py`

### "TypeScript errors"
```bash
# Check for errors
npx tsc --noEmit

# Fix common issues
npm run lint -- --fix
```

## Performance Profiling

```typescript
// Time a function
console.time('functionName');
// ... code to measure
console.timeEnd('functionName');

// Check database query time
const start = Date.now();
const result = await prisma.student.findMany();
console.log(`Query took ${Date.now() - start}ms`);
```

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push and create PR
git push origin feature/new-feature

# After review, merge to main
git checkout main
git merge feature/new-feature
```

## Environment Variables Reference

| Variable | Location | Purpose | Example |
|----------|----------|---------|---------|
| DATABASE_URL | .env.local | Database connection | postgresql://... |
| NEXT_PUBLIC_PYTHON_API_URL | .env.local | Python API URL | http://localhost:8000 |
| NEXT_PUBLIC_FACE_RECOGNITION_THRESHOLD | .env.local | Recognition threshold | 0.6 |
| FACE_RECOGNITION_THRESHOLD | python/.env | Python threshold | 0.6 |

## Useful Commands

```bash
# Development
npm run dev              # Start Next.js dev server
npm run build           # Build for production
npm run lint            # Run ESLint

# Database
npx prisma studio      # Open database UI
npx prisma generate    # Generate types
npx prisma migrate dev # Create migration

# Python
cd python && python main.py  # Start API server
pip install -r requirements.txt  # Install deps

# Docker
docker-compose up       # Start all services
docker-compose down     # Stop all services
docker-compose logs -f  # View logs
```

## File Size Limits

- Image uploads: max ~5MB
- Database VARCHAR: 255 characters by default
- Face encoding JSON: ~128KB per student

## Performance Tips

1. Add database indexes for frequently queried fields
2. Use pagination for large result sets
3. Cache student encodings in memory
4. Compress images before upload
5. Use CDN for static assets in production

## Security Checklist

- [ ] No secrets in `.env.local` committed to git
- [ ] API routes validate input
- [ ] Database queries use parameterized queries
- [ ] HTTPS enabled in production
- [ ] CORS properly configured
- [ ] Error messages don't leak sensitive info
- [ ] Rate limiting implemented
- [ ] Admin routes protected

## Extensions & Integrations

### Adding Email Notifications

```typescript
// Install: npm install nodemailer
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});
```

### Adding Authentication

```typescript
// Install: npm install next-auth
// See: https://authjs.dev/getting-started/installation
```

### Adding Real-time Updates

```typescript
// Install: npm install socket.io-client
// Use WebSockets for live dashboard updates
```

## Monitoring & Logging

```typescript
// Log important events
console.log('[ATTENDANCE]', `Student ${id} marked at ${time}`);
console.error('[ERROR]', 'Failed to encode face:', error);

// In production, use a service like:
// - Sentry (error tracking)
// - LogRocket (session replay)
// - DataDog (monitoring)
```

## Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] Environment variables documented
- [ ] Database migrations ready
- [ ] No console warnings
- [ ] Performance benchmarked
- [ ] Security review completed
- [ ] Backup strategy in place

## Need Help?

1. Check README.md for overview
2. Check IMPLEMENTATION_SUMMARY.md for architecture
3. Check ENV_CONFIG.md for environment setup
4. Check specific component source code
5. Check Python backend in `python/main.py`

## Next Steps for New Developers

1. Clone repository and run setup
2. Read IMPLEMENTATION_SUMMARY.md
3. Explore the codebase structure
4. Test all workflows manually
5. Review database schema in Prisma Studio
6. Study key components (registration, attendance)
7. Review API routes in app/api
8. Run existing tests
9. Make a small contribution
10. Review with team

Happy coding!
