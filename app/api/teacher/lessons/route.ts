import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.user_metadata.role !== 'TEACHER') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { classId, subjectId, periodId, date, topic, objectives, materials } = body;

        // Upsert Lesson
        // We'll search for an existing lesson for this exact slot (class, subject, period, date)
        // If periodId is missing (freelance lesson?), matching by class/subject/date might be ambiguous if multiple periods.
        // But for schedule sync, periodId is key.

        const existingLesson = await prisma.lesson.findFirst({
            where: {
                classId,
                subjectId,
                periodId,
                date: new Date(date), // ensure date matches
                teacherId: user.id
            }
        });

        let lesson;

        if (existingLesson) {
            lesson = await prisma.lesson.update({
                where: { id: existingLesson.id },
                data: { topic, objectives, materials }
            });
        } else {
            lesson = await prisma.lesson.create({
                data: {
                    classId,
                    subjectId,
                    periodId,
                    teacherId: user.id,
                    date: new Date(date),
                    topic,
                    objectives,
                    materials
                }
            });
        }

        return NextResponse.json({ lesson });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to sync lesson" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    // Helper to get lesson for a slot?
    // Maybe unnecessary if we load lessons with the schedule.
    // Leaving empty for now.
    return NextResponse.json({ message: "Use POST to sync" });
}
