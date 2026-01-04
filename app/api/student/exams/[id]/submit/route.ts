import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/security";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const user = await requireRole(['STUDENT']);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const student = await prisma.student.findFirst({ where: { userId: user.id } });
        if (!student) return NextResponse.json({ error: "Student profile missing" }, { status: 404 });

        const exam = await prisma.exam.findUnique({
            where: { id },
            include: { subject: true }
        });
        if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

        const { answers } = await request.json();
        const questions = exam.questions as any[] || [];

        let earnedPoints = 0;
        let totalPoints = 0;
        const gradingDetails: any[] = [];

        // Advanced Grading Matrix
        for (const q of questions) {
            const studentAnswer = answers[q.id];
            const weight = q.points || 10;
            totalPoints += weight;
            let qScore = 0;
            let feedback = "";

            if (!studentAnswer) {
                gradingDetails.push({ id: q.id, score: 0, status: 'MISSING' });
                continue;
            }

            switch (q.type) {
                case "MCQ":
                    // Frontend sends string, DB has index
                    if (studentAnswer === q.options[q.correctOption]) {
                        qScore = weight;
                    }
                    break;

                case "TF":
                    if (studentAnswer?.toLowerCase() === (q.answer ? "true" : "false")) {
                        qScore = weight;
                    }
                    break;

                case "SHORT":
                    const normalizedAns = studentAnswer.trim().toLowerCase();
                    const correctAns = q.answer.trim().toLowerCase();
                    if (normalizedAns === correctAns) {
                        qScore = weight;
                    } else if (q.keywords?.some((k: string) => normalizedAns.includes(k.toLowerCase()))) {
                        // Partial credit for keywords if not exact
                        const matchedCount = q.keywords.filter((k: string) => normalizedAns.includes(k.toLowerCase())).length;
                        qScore = (matchedCount / q.keywords.length) * weight * 0.8; // Max 80% for keywords
                    }
                    break;

                case "LONG":
                    // AI EVALUATION
                    try {
                        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                        const aiPrompt = `
                            Evaluate this student's essay answer for a ${weight} point question.
                            Question: ${q.text}
                            Criteria: ${q.criteria}
                            Student Answer: ${studentAnswer}
                            Return JSON: { "score": number, "feedback": "string" }
                            Score should be between 0 and ${weight}.
                        `;
                        const res = await model.generateContent(aiPrompt);
                        const aiData = JSON.parse(res.response.text().replace(/```json|```/g, ""));
                        qScore = aiData.score;
                        feedback = aiData.feedback;
                    } catch (err) {
                        console.error("AI Grading Failure:", err);
                        qScore = 0; // Manual review fallback?
                    }
                    break;
            }

            earnedPoints += qScore;
            gradingDetails.push({ id: q.id, score: qScore, feedback });
        }

        const finalScore = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

        await prisma.$transaction(async (tx) => {
            await tx.examAttempt.create({
                data: {
                    examId: exam.id,
                    studentId: student.id,
                    submittedAt: new Date(),
                    score: finalScore,
                    answers: answers,
                    status: 'SUBMITTED',
                    metadata: { gradingDetails } as any
                }
            });

            await (tx.gradeRecord as any).upsert({
                where: { studentId_examId: { studentId: student.id, examId: exam.id } },
                create: {
                    studentId: student.id,
                    examId: exam.id,
                    subjectId: exam.subjectId,
                    score: finalScore,
                    status: 'SUBMITTED',
                    remark: `AI-Assisted Grade: ${earnedPoints}/${totalPoints}`,
                    createdById: user.id
                },
                update: {
                    score: finalScore,
                    status: 'SUBMITTED',
                    remark: `Re-submitted AI-Assisted Grade: ${earnedPoints}/${totalPoints}`
                }
            });

            await (tx.attendanceRecord as any).upsert({
                where: { studentId_examId: { studentId: student.id, examId: exam.id } },
                create: {
                    studentId: student.id,
                    examId: exam.id,
                    classId: student.classId!,
                    subjectId: exam.subjectId,
                    status: 'PRESENT',
                    date: new Date(),
                    createdById: user.id
                },
                update: { status: 'PRESENT' }
            });
        });

        return NextResponse.json({
            success: true,
            score: finalScore,
            totalPoints,
            earnedPoints
        });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Assessment submission failed" }, { status: 500 });
    }
}
