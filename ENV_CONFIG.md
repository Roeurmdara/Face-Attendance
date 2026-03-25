# Environment Configuration Guide

This document explains all environment variables and how to configure them.

## `.env.local` - Frontend Configuration

Create this file in the project root with your local settings.

### Required Variables

#### DATABASE_URL
**Database connection string**

Format: `postgresql://[user]:[password]@[host]:[port]/[database]`

Examples:
```env
# Local PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/attendance_db"

# Neon serverless
DATABASE_URL="postgresql://user:password@ep-xxxxx.neon.tech/dbname"

# AWS RDS
DATABASE_URL="postgresql://admin:password@mydb.xxxxx.rds.amazonaws.com:5432/attendance"
```

### API Configuration

#### NEXT_PUBLIC_PYTHON_API_URL
**URL of the Python FastAPI backend**

Default: `http://localhost:8000`

Examples:
```env
# Local development
NEXT_PUBLIC_PYTHON_API_URL="http://localhost:8000"

# Docker
NEXT_PUBLIC_PYTHON_API_URL="http://python-api:8000"

# Production
NEXT_PUBLIC_PYTHON_API_URL="https://api.example.com"
```

**Note:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Don't put secrets here.

### Face Recognition Configuration

#### NEXT_PUBLIC_FACE_RECOGNITION_THRESHOLD
**Confidence threshold for face recognition (0.0 - 1.0)**

Default: `0.6`

Recommended settings:
- `0.5` - Very lenient (may have false positives)
- `0.6` - **Recommended** (balanced)
- `0.65` - Strict (fewer false matches)
- `0.7` - Very strict (may miss valid matches)

```env
NEXT_PUBLIC_FACE_RECOGNITION_THRESHOLD="0.6"
```

## `python/.env` - Python Backend Configuration

Create this file in the `python/` directory.

### Face Recognition

#### FACE_RECOGNITION_THRESHOLD
**Face recognition confidence threshold**

Must match `NEXT_PUBLIC_FACE_RECOGNITION_THRESHOLD` in frontend.

```env
FACE_RECOGNITION_THRESHOLD=0.6
```

## Complete `.env.local` Example

```env
# ============================================
# DATABASE
# ============================================
DATABASE_URL="postgresql://postgres:password@localhost:5432/attendance_db"

# ============================================
# API CONFIGURATION
# ============================================
NEXT_PUBLIC_PYTHON_API_URL="http://localhost:8000"

# ============================================
# FACE RECOGNITION
# ============================================
NEXT_PUBLIC_FACE_RECOGNITION_THRESHOLD="0.6"

# ============================================
# OPTIONAL - PRODUCTION FEATURES
# ============================================
# NEXT_AUTH_SECRET="your-secret-key"
# NEXT_PUBLIC_ENABLE_ANALYTICS="true"
```

## Production Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel Dashboard:
   - Settings → Environment Variables
   - Add `DATABASE_URL`, `NEXT_PUBLIC_PYTHON_API_URL`

```env
DATABASE_URL=postgresql://user:pass@host:5432/db
NEXT_PUBLIC_PYTHON_API_URL=https://api.example.com
NEXT_PUBLIC_FACE_RECOGNITION_THRESHOLD=0.6
```

### Self-Hosted Deployment

Create `.env.production` with production values:

```env
DATABASE_URL="postgresql://user:password@prod-db.example.com:5432/attendance"
NEXT_PUBLIC_PYTHON_API_URL="https://api.example.com"
NEXT_PUBLIC_FACE_RECOGNITION_THRESHOLD="0.6"
```

### Docker Deployment

Create `.env` file and pass to Docker:

```bash
docker run --env-file .env myapp:latest
```

Or in `docker-compose.yml`:

```yaml
services:
  frontend:
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXT_PUBLIC_PYTHON_API_URL=${NEXT_PUBLIC_PYTHON_API_URL}
```

## Docker Compose Configuration

When using Docker Compose, set variables:

```bash
# Using .env file (automatically loaded)
# Create .env file with:
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/attendance_db
NEXT_PUBLIC_PYTHON_API_URL=http://python-api:8000

# Then run:
docker-compose up
```

Or inline:

```bash
docker-compose up \
  -e DATABASE_URL="postgresql://..." \
  -e NEXT_PUBLIC_PYTHON_API_URL="http://python-api:8000"
```

## Database Connection Strings

### PostgreSQL Localhost
```
postgresql://postgres:password@localhost:5432/attendance_db
```

### PostgreSQL with custom user
```
postgresql://myuser:mypass@localhost:5432/attendance_db
```

### Neon (Serverless PostgreSQL)
```
postgresql://user:password@ep-cool-voice-xxxxx.neon.tech/neondb?sslmode=require
```

### AWS RDS PostgreSQL
```
postgresql://admin:password@mydb.xxxxx.rds.amazonaws.com:5432/postgres
```

### Google Cloud SQL
```
postgresql://postgres:password@/dbname?unix_socket=/cloudsql/project:region:instance
```

### Railway.app
```
postgresql://postgres:password@containers.railway.app:7652/railway
```

## Verifying Configuration

### Test Database Connection

```bash
# Using psql
psql "$DATABASE_URL"

# Should connect successfully and show psql prompt
```

### Test Python API

```bash
# Check if running
curl http://localhost:8000/health

# Should return:
# {"status": "ok", "service": "face-recognition"}
```

### Test Frontend Configuration

```bash
# Check environment in browser console
# Open http://localhost:3000
# In browser console:
console.log(process.env.NEXT_PUBLIC_PYTHON_API_URL)
```

## Troubleshooting

### "DATABASE_URL is not set"

```bash
# Check if .env.local exists
ls -la .env.local

# Check content
cat .env.local

# Make sure Next.js is restarted after adding env vars
npm run dev
```

### "Cannot connect to Python API"

1. Check `NEXT_PUBLIC_PYTHON_API_URL` is correct
2. Verify Python server is running: `curl http://localhost:8000/health`
3. Check CORS settings in `python/main.py`
4. Verify firewall allows connection

### "Wrong face recognition threshold"

Make sure both are set to same value:
- Frontend: `NEXT_PUBLIC_FACE_RECOGNITION_THRESHOLD` in `.env.local`
- Backend: `FACE_RECOGNITION_THRESHOLD` in `python/.env`

## Security Best Practices

1. **Never commit `.env.local`** - Add to `.gitignore`
2. **Use secrets in production** - Use managed secrets (Vercel Secrets, AWS Secrets Manager)
3. **Rotate credentials** - Change database passwords regularly
4. **Use HTTPS** - Always use HTTPS URLs in production
5. **Protect API URL** - In production, don't expose internal API URLs

## Environment-Specific Configurations

### Development
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/attendance_db"
NEXT_PUBLIC_PYTHON_API_URL="http://localhost:8000"
NEXT_PUBLIC_FACE_RECOGNITION_THRESHOLD="0.6"
```

### Staging
```env
DATABASE_URL="postgresql://user:password@staging-db.example.com/attendance"
NEXT_PUBLIC_PYTHON_API_URL="https://staging-api.example.com"
NEXT_PUBLIC_FACE_RECOGNITION_THRESHOLD="0.65"
```

### Production
```env
DATABASE_URL="postgresql://user:password@prod-db.example.com/attendance"
NEXT_PUBLIC_PYTHON_API_URL="https://api.example.com"
NEXT_PUBLIC_FACE_RECOGNITION_THRESHOLD="0.65"
```

## Resetting to Defaults

If you want to reset to example configuration:

```bash
# Copy example
cp .env.example .env.local

# Edit with your values
nano .env.local

# Restart Next.js
npm run dev
```
