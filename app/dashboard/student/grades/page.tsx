"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Award, TrendingUp } from "lucide-react";

export default function StudentGradesPage() {
    const [grades, setGrades] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Need an API to fetch student's own grades. 
        // /api/student/grades doesn't exist.
        // I can reuse /api/teacher/grades?studentId=me if I update it, or create /api/student/grades?
        // Let's create specific /api/student/grades route for security/simplicity.
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/student/grades');
            const data = await res.json();
            if (data.grouped) setSubjects(data.grouped);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Fallback UI
    if (loading) return <div className="p-8">Loading grades...</div>;

    return (
        <div className="space-y-6 animate-in fade-in">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">My Grades</h2>
                <p className="text-gray-500 dark:text-gray-400">Track your academic progress.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {subjects.map((sub: any) => (
                    <Card key={sub.subjectId} className="overflow-hidden border-t-4 border-t-eduGreen-600 bg-zinc-950/40 backdrop-blur-xl border-zinc-900">
                        <CardHeader className="bg-zinc-950/50 pb-4">
                            <CardTitle className="flex justify-between items-center">
                                <span className="text-zinc-100 font-black tracking-tight">{sub.subjectName}</span>
                                <span className={`text-lg font-black italic tracking-tighter ${sub.average >= 90 ? "text-eduGreen-500" :
                                    sub.average >= 80 ? "text-eduGreen-400" :
                                        sub.average >= 70 ? "text-yellow-500" : "text-red-500"
                                    }`}>{sub.average > 0 ? sub.average.toFixed(1) + "%" : "N/A"}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                                {sub.exams.map((exam: any) => (
                                    <div key={exam.id} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-zinc-900">
                                        <div>
                                            <div className="font-medium">{exam.title}</div>
                                            <div className="text-xs text-gray-500">{new Date(exam.date).toLocaleDateString()}</div>
                                        </div>
                                        <div className="font-mono font-semibold">
                                            {exam.score} <span className="text-gray-400 font-normal">/ {exam.maxScore}</span>
                                        </div>
                                    </div>
                                ))}
                                {sub.exams.length === 0 && (
                                    <div className="p-4 text-center text-sm text-gray-400">No grades recorded.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {subjects.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    No grades found.
                </div>
            )}
        </div>
    );
}
