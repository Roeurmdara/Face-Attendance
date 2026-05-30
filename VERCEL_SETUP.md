# Vercel Deployment Setup Guide

## Quick Start

### Option 1: Keep Python Backend Separate (Easiest for now)

1. **Deploy Next.js to Vercel:**

   ```bash
   npm install -g vercel
   vercel
   ```

2. **Setup PostgreSQL:**
   - Use [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
   - Or use [Supabase](https://supabase.com), [Railway](https://railway.app), or [Neon](https://neon.tech)

3. **Deploy Python Backend Separately:**
   - Deploy `python/main.py` to [Railway](https://railway.app), [Render](https://render.com), or [Fly.io](https://fly.io)
   - Update `NEXT_PUBLIC_PYTHON_API_URL` in Vercel environment variables to point to your Python service

4. **Environment Variables in Vercel:**
   Go to Project Settings → Environment Variables and add:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `NEXT_PUBLIC_PYTHON_API_URL` - Your Python backend URL (e.g., `https://your-api.railway.app`)

---

### Option 2: Full Node.js Migration (Recommended Long-term)

Migrate the Python FastAPI backend to Node.js to run on Vercel serverless functions.

**Steps:**

1. Create Node.js equivalent of face encoding/recognition endpoints
2. Use a Node.js library for face recognition (e.g., `face-api.js`, `tracking.js`)
3. Replace all `/api/face/*` endpoints with Node.js implementations
4. Deploy as single Next.js application

**Benefits:**

- No separate backend needed
- Simpler deployment
- Faster response times
- Single codebase

---

## Environment Setup

### For Local Development:

```bash
# Keep your current .env file
DATABASE_URL="postgresql://postgres:1234@localhost:5433/face"
NEXT_PUBLIC_PYTHON_API_URL="http://localhost:8000"
```

### For Vercel Deployment:

1. Connect your GitHub repository to Vercel
2. Go to Settings → Environment Variables
3. Add these variables:

| Variable                     | Value                          | Example                                            |
| ---------------------------- | ------------------------------ | -------------------------------------------------- |
| `DATABASE_URL`               | Your production PostgreSQL URL | `postgresql://user:pass@db.provider.com:5432/face` |
| `NEXT_PUBLIC_PYTHON_API_URL` | Your Python backend URL        | `https://api.railway.app`                          |

---

## Database Migration

When deploying to production:

```bash
# Run migrations on production database
npx prisma migrate deploy --skip-generate

# Or use Prisma Data Proxy (recommended for serverless)
# Update DATABASE_URL to use Prisma Data Proxy connection string
```

For serverless databases with connection pooling:

- [Prisma Data Proxy](https://www.prisma.io/docs/data-platform/data-proxy)
- [PgBouncer](https://www.pgbouncer.org/)

---

## Vercel Deployment Steps

1. **Push code to GitHub:**

   ```bash
   git add .
   git commit -m "Setup for Vercel deployment"
   git push
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Framework: Next.js
   - Root Directory: `.` (current directory)

3. **Configure Environment Variables:**
   - Set `DATABASE_URL` with your PostgreSQL connection string
   - Set `NEXT_PUBLIC_PYTHON_API_URL` (if using separate backend)

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete

---

## Troubleshooting

### Build Fails with Prisma Error:

- Ensure `DATABASE_URL` is set in environment variables
- Run migrations before deploying: `npx prisma migrate deploy`

### Python API Not Reachable:

- Verify `NEXT_PUBLIC_PYTHON_API_URL` is correct
- Ensure Python service CORS allows Vercel domain
- Check if Python service is running/deployed

### Database Connection Pooling Issues:

- Use connection pooling service (Prisma Data Proxy, PgBouncer)
- Set `connection_limit` in Prisma schema

---

## Next Steps

1. **Choose deployment approach** (Option 1 or 2)
2. **Setup database service** (Vercel Postgres, Supabase, etc.)
3. **If using separate Python backend**, deploy to Railway/Render
4. **Connect GitHub to Vercel** and deploy
5. **Run database migrations** on production

For questions, refer to:

- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/app/building-your-application/deploying)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
