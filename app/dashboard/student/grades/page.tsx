"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    BookOpen, Award, TrendingUp, Brain, Zap, CheckCircle2,
    XCircle, History, MessageSquare, ChevronRight, Sparkles,
    Timer, FileText, AlertCircle, ArrowRight, Lock
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function StudentGradesPage() {
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedExam, setSelectedExam] = useState<any>(null);
    const [isInsightOpen, setIsInsightOpen] = useState(false);

    useEffect(() => {
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

    const ResultInsightModal = ({ exam }: { exam: any }) => {
        if (!exam || !exam.attempt) return null;
        const attempt = exam.attempt;
        const questions = attempt.questions || [];
        const gradingDetails = (attempt.metadata as any)?.gradingDetails || [];

        return (
            <Dialog open={isInsightOpen} onOpenChange={setIsInsightOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-zinc-950 border-zinc-900 rounded-[2.5rem] p-10 border-t-eduGreen-500/20">
                    <DialogHeader>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 bg-eduGreen-500/10 rounded-2xl flex items-center justify-center border border-eduGreen-500/20 shadow-[0_0_20px_rgba(20,184,115,0.1)]">
                                <Brain className="w-7 h-7 text-eduGreen-500" />
                            </div>
                            <div>
                                <DialogTitle className="text-3xl font-black text-white italic uppercase">{exam.title} Insights</DialogTitle>
                                <DialogDescription className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">AI-Powered Performance Feedback</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-8 mt-6">
                        {/* Summary Card */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="bg-zinc-900/40 border-zinc-900 rounded-3xl p-6 group transition-all hover:border-eduGreen-500/30">
                                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Award className="w-3 h-3" /> Final Score
                                </div>
                                <div className="text-4xl font-black text-eduGreen-500 italic">
                                    {((exam.score / exam.maxScore) * 100).toFixed(1)}%
                                </div>
                                <div className="text-[10px] font-bold text-zinc-600 mt-1 uppercase italic">{exam.score} / {exam.maxScore} Base Points</div>
                            </Card>

                            <Card className="bg-zinc-900/40 border-zinc-900 rounded-3xl p-6 md:col-span-2">
                                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Sparkles className="w-3 h-3 text-amber-500" /> Neural Verdict
                                </div>
                                <p className="text-sm text-zinc-300 font-medium italic leading-relaxed">
                                    {exam.remark || "Your assessment has been reviewed by the neural engine. Detailed question-level feedback is available below to help you improve."}
                                </p>
                            </Card>
                        </div>

                        {/* Questions Review */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-zinc-700 uppercase tracking-[0.3em] pl-2 border-l-2 border-zinc-800">Knowledge Audit</h3>
                            {questions.map((q: any, i: number) => {
                                const ans = attempt.answers[q.id];
                                const grading = gradingDetails.find((d: any) => d.id === q.id);
                                const isPerfect = grading?.score === q.points;
                                const isPartial = grading?.score > 0 && grading?.score < q.points;

                                return (
                                    <div key={q.id} className="relative group/q">
                                        <div className={cn(
                                            "bg-zinc-900/20 border rounded-[2rem] p-8 transition-all hover:bg-zinc-900/30",
                                            isPerfect ? "border-eduGreen-500/20 hover:border-eduGreen-500/40" :
                                                isPartial ? "border-amber-500/20 hover:border-amber-500/40" : "border-zinc-800 hover:border-zinc-700"
                                        )}>
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Question {i + 1}</span>
                                                    {isPerfect ? <CheckCircle2 className="w-4 h-4 text-eduGreen-500" /> :
                                                        isPartial ? <TrendingUp className="w-4 h-4 text-amber-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                                                </div>
                                                <div className="text-right">
                                                    <div className={cn("text-lg font-black italic", isPerfect ? "text-eduGreen-500" : "text-zinc-500")}>
                                                        {grading?.score || 0} <span className="text-zinc-700 text-xs">/ {q.points}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="text-base font-bold text-zinc-100 mb-6">{q.text}</p>

                                            <div className="grid md:grid-cols-2 gap-6">
                                                {/* Student Answer */}
                                                <div className="bg-zinc-950/40 rounded-2xl p-4 border border-zinc-900">
                                                    <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                        <History className="w-3 h-3" /> Your Response
                                                    </div>
                                                    <p className="text-xs text-zinc-400 font-medium italic">
                                                        {ans || "No response recorded."}
                                                    </p>
                                                </div>

                                                {/* AI Feedback */}
                                                <div className="bg-eduGreen-950/10 rounded-2xl p-4 border border-eduGreen-900/20">
                                                    <div className="text-[9px] font-black text-eduGreen-500/50 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                        <Zap className="w-3 h-3 text-eduGreen-500" /> Improvement Insight
                                                    </div>
                                                    <p className="text-xs text-zinc-300 font-medium italic">
                                                        {grading?.feedback || "System validated your response according to institutional criteria."}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="pt-6 border-t border-zinc-900 flex justify-end">
                            <Button onClick={() => setIsInsightOpen(false)} className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-black uppercase tracking-widest px-10 rounded-2xl h-14">
                                Close Portal
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    };

    if (loading) return <div className="p-8">Loading grades...</div>;

    return (
        <div className="space-y-12 animate-in fade-in pb-20">
            <div>
                <h2 className="text-5xl font-black tracking-tighter text-white italic uppercase">Academic Matrix</h2>
                <div className="flex items-center gap-3 mt-2">
                    <div className="h-0.5 w-12 bg-eduGreen-500" />
                    <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-xs">Performance Intelligence Center</p>
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                {subjects.map((sub: any) => (
                    <Card key={sub.subjectId} className="overflow-hidden border-zinc-900 bg-zinc-950/20 backdrop-blur-3xl rounded-[3rem] transition-all hover:bg-zinc-950/40 border group">
                        <CardHeader className="bg-zinc-900/10 p-10 pb-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-1">Subject Entity</div>
                                    <CardTitle className="text-3xl font-black text-white italic uppercase tracking-tight">{sub.subjectName}</CardTitle>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-1">Cumulative</div>
                                    <span className={`text-4xl font-black italic tracking-tighter ${sub.average >= 90 ? "text-eduGreen-500" : "text-zinc-500"}`}>
                                        {sub.average > 0 ? sub.average.toFixed(1) + "%" : "--"}
                                    </span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-zinc-900/50">
                                {sub.exams.map((exam: any) => (
                                    <div
                                        key={exam.id}
                                        onClick={() => { if (exam.attempt) { setSelectedExam(exam); setIsInsightOpen(true); } }}
                                        className={cn(
                                            "px-10 py-8 flex justify-between items-center transition-all group/exam",
                                            exam.attempt ? "cursor-pointer hover:bg-eduGreen-500/5" : "opacity-60 cursor-not-allowed"
                                        )}
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all border",
                                                exam.attempt ? "bg-zinc-900 border-zinc-800 text-zinc-600 group-hover/exam:border-eduGreen-500 group-hover/exam:text-eduGreen-500" : "bg-zinc-950 border-zinc-900 text-zinc-800"
                                            )}>
                                                {exam.attempt ? <Brain className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <div className="font-black text-zinc-200 uppercase italic tracking-tight group-hover/exam:text-white transition-colors">{exam.title}</div>
                                                <div className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">{new Date(exam.date).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <div className="text-2xl font-black text-white italic">{exam.score} <span className="text-zinc-800 text-xs not-italic">/ {exam.maxScore}</span></div>
                                                {exam.attempt && (
                                                    <div className="text-[9px] font-black text-eduGreen-500 uppercase tracking-widest flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 px-3 rounded-lg bg-eduGreen-500/10 border border-eduGreen-500/20 text-eduGreen-500 hover:bg-eduGreen-500 hover:text-black transition-all gap-2"
                                                        >
                                                            <Brain className="w-3.5 h-3.5" />
                                                            Open Insight
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {sub.exams.length === 0 && (
                                    <div className="p-10 text-center text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em]">Neural records empty.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {subjects.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed border-zinc-900 rounded-[3rem]">
                    <div className="text-zinc-700 font-black uppercase tracking-[0.5em] text-sm italic">Terminal Data Vacancy</div>
                    <p className="text-zinc-800 mt-2 text-xs font-bold uppercase tracking-widest">No academic signatures detected in the matrix.</p>
                </div>
            )}

            {selectedExam && <ResultInsightModal exam={selectedExam} />}
        </div>
    );
}
