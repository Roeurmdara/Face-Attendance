import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/attendance?date=YYYY-MM-DD&studentId=1
 * Fetch attendance records, optionally filtered by date or student
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get("date");
    const studentIdParam = searchParams.get("studentId");

    const where: any = {};

    // Filter by date
    if (dateParam) {
      const startDate = new Date(dateParam);
      const endDate = new Date(dateParam);
      endDate.setDate(endDate.getDate() + 1);

      where.date = {
        gte: startDate,
        lt: endDate,
      };
    }

    // Filter by studentId
    if (studentIdParam) {
      const studentId = parseInt(studentIdParam, 10);
      if (!isNaN(studentId)) where.studentId = studentId;
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            rollNumber: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { checkInTime: "desc" },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance records" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * POST /api/attendance
 * Record attendance for a student
 * Body: { studentId: number, confidence?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, confidence } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: parseInt(studentId, 10) },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not registered yet" },
        { status: 404 }
      );
    }

    // UTC-safe start of today
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // Check if attendance already exists today
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        studentId_date: {
          studentId: parseInt(studentId, 10),
          date: todayUTC,
        },
      },
    });

    if (existingAttendance) {
      return NextResponse.json(
        { error: "Student already marked present today" },
        { status: 409 }
      );
    }

    // Record attendance
    const attendance = await prisma.attendance.create({
      data: {
        studentId: parseInt(studentId, 10),
        date: todayUTC,
        checkInTime: new Date(),
        confidence: confidence ?? 0.95,
      },
      include: {
        student: {
          select: {
            rollNumber: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error: any) {
    console.error("Error recording attendance:", error);

    // Prisma unique constraint error
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Attendance already recorded for this date" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to record attendance" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}