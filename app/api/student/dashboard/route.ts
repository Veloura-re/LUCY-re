import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return new NextResponse("Unauthorized", { status: 401 });

        // 1. Get Student Profile
        const student = await prisma.student.findFirst({
            where: { userId: user.id },
            include: { class: true, school: true }
        });

        if (!student || !student.classId) {
            console.log("[Dashboard] Student profile inactive for user", user.id);
            return NextResponse.json({ error: "Student profile not active" }, { status: 404 });
        }
        console.log("[Dashboard] Serving data for:", student.firstName);

        // 2. Determine Current Context
        const now = new Date();
        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']; // 0-6
        const dayOfWeek = days[now.getDay()];
        const currentTimeVal = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight

        // 3. Find Schedule
        // Fetch periods to find "Current" one
        const periods = await prisma.period.findMany({
            where: { schoolId: student.schoolId },
            orderBy: { startTime: 'asc' }
        });

        let currentPeriod = null;
        let activeLesson = null;

        for (const p of periods) {
            const [startH, startM] = p.startTime.split(':').map(Number);
            const [endH, endM] = p.endTime.split(':').map(Number);
            const startVal = startH * 60 + startM;
            const endVal = endH * 60 + endM;

            if (currentTimeVal >= startVal && currentTimeVal <= endVal) {
                currentPeriod = p;
                break;
            }
        }

        try {
            if (currentPeriod) {
                // Get Subject/Teacher for this slot
                const timetable = await prisma.timetable.findFirst({
                    where: {
                        classId: student.classId,
                        periodId: currentPeriod.id,
                        dayOfWeek: dayOfWeek as any
                    },
                    include: { subject: true, teacher: true }
                });

                if (timetable) {
                    // Get Specific Lesson Content (Topic)
                    // SAFELY try to get lesson, if model missing, ignore
                    let todayLesson = null;
                    try {
                        // @ts-ignore
                        todayLesson = await prisma.lesson.findFirst({
                            where: {
                                classId: student.classId,
                                periodId: currentPeriod.id,
                                date: {
                                    gte: new Date(now.setHours(0, 0, 0, 0)),
                                    lt: new Date(now.setHours(23, 59, 59, 999))
                                }
                            }
                        });
                    } catch (err) {
                        console.warn("Lesson fetch failed (model missing?):", err);
                    }

                    // Assemble Lesson Object
                    const [sH, sM] = currentPeriod.startTime.split(':').map(Number);
                    const [eH, eM] = currentPeriod.endTime.split(':').map(Number);
                    const startD = new Date(); startD.setHours(sH, sM, 0);
                    const endD = new Date(); endD.setHours(eH, eM, 0);

                    activeLesson = {
                        subject: timetable.subject.name,
                        topic: todayLesson?.topic || "Regular Session",
                        teacher: timetable.teacher.name,
                        startTime: startD,
                        endTime: endD,
                        period: currentPeriod.name,
                        materials: todayLesson?.materials || []
                    };
                }
            }
        } catch (lessonError) {
            console.error("Dashboard Lesson Error:", lessonError);
            // Continue to return name even if lesson fails
        }

        // 4. Stats
        // Attendance
        const attendanceCount = await prisma.attendanceRecord.count({ where: { studentId: student.id, status: 'PRESENT' } });
        const totalAttendance = await prisma.attendanceRecord.count({ where: { studentId: student.id } });
        const attendancePct = totalAttendance > 0 ? (attendanceCount / totalAttendance) * 100 : 100;

        // Upcoming Exam
        const nextExam = await prisma.exam.findFirst({
            where: {
                classId: student.classId,
                dueAt: { gte: new Date() }
            },
            orderBy: { dueAt: 'asc' },
            include: { subject: true }
        });

        return NextResponse.json({
            studentName: `${student.firstName} ${student.lastName}`,
            currentLesson: activeLesson,
            attendance: attendancePct,
            nextExam: nextExam ? {
                subject: nextExam.subject.name,
                title: nextExam.title,
                date: nextExam.dueAt
            } : null
        });

    } catch (e: any) {
        console.error("Dashboard API Error:", e);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
