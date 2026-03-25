#!/bin/bash

# Setup Database Script for Attendance System
# This script initializes the PostgreSQL database and runs Prisma migrations

set -e

echo "Setting up Attendance System Database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is not set"
    echo "Please set it in your .env.local file"
    exit 1
fi

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Generating Prisma Client..."
npx prisma generate

echo "Database setup complete!"
echo ""
echo "Database schema initialized with:"
echo "  - Students table (id, rollNumber, firstName, lastName, email, phoneNumber, faceEncodingPath)"
echo "  - Attendance table (id, studentId, date, checkInTime, confidence)"
