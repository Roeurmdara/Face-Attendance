import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
/**
 * GET /api/students
 * Returns all students with their face encodings for recognition
 */
export async function GET() {
  try {
    const students = await prisma.student.findMany({
      select: {
        id: true,
        rollNumber: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        faceEncodingPath: true,
        faceEncodings: true, // ← explicitly include so Prisma doesn't omit it
        registeredAt: true,
      },
      orderBy: { registeredAt: "desc" },
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/students
 * Creates a new student and saves face encodings to the database
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      rollNumber,
      firstName,
      lastName,
      email,
      phoneNumber,
      faceEncodings, // ← number[][] sent from registration form
    } = body;

    if (!rollNumber || !firstName || !lastName) {
      return NextResponse.json(
        { error: "rollNumber, firstName, and lastName are required" },
        { status: 400 }
      );
    }

    if (!faceEncodings || !Array.isArray(faceEncodings) || faceEncodings.length === 0) {
      return NextResponse.json(
        { error: "At least one face encoding is required" },
        { status: 400 }
      );
    }

    // Check if roll number already exists
    const existing = await prisma.student.findUnique({
      where: { rollNumber },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A student with this roll number already exists" },
        { status: 409 }
      );
    }

    const student = await prisma.student.create({
      data: {
        rollNumber,
        firstName,
        lastName,
        email: email || null,
        phoneNumber: phoneNumber || null,
        faceEncodings: faceEncodings, // ← save encodings directly in DB
        faceEncodingPath: `encodings/${rollNumber}.json`, // kept for reference
      },
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 }
    );
  }
}