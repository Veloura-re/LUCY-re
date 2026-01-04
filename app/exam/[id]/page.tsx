"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2 as Loader2Icon, Timer, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ExamRoomPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [examData, setExamData] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchExam = async () => {
            try {
                const res = await fetch(`/api/student/exams/${params.id}`);
                const data = await res.json();
                if (data.error) {
                    toast.error(data.error);
                    router.push("/dashboard/student/exams");
                    return;
                }
                setExamData(data.exam);
                setTimeLeft((data.exam.duration || 60) * 60);
            } catch (e) {
                toast.error("Failed to initialize assessment uplink.");
            } finally {
                setLoading(false);
            }
        };
        fetchExam();
    }, [params.id, router]);

    // Timer
    useEffect(() => {
        if (loading || !examData) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [loading, examData]);

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/student/exams/${params.id}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers })
            });
            const data = await res.json();

            if (data.success) {
                toast.success(`Assessment Concluded. Score: ${data.score.toFixed(1)}%`);
                router.push("/dashboard/student/exams?status=completed");
            } else {
                toast.error(data.error || "Submission failed.");
            }
        } catch (e) {
            toast.error("Critical Uplink Failure during submission.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-zinc-950">
            <Loader2Icon className="w-12 h-12 text-eduGreen-500 animate-spin" />
            <p className="text-zinc-500 font-black uppercase tracking-[0.4em] text-xs">Establishing Protocol Uplink...</p>
        </div>
    );

    if (!examData) return null;

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col">
            <header className="sticky top-0 z-[60] h-20 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-900 flex items-center justify-between px-8">
                <div className="flex items-center gap-4">
                    <ShieldAlert className="w-5 h-5 text-eduGreen-500" />
                    <div>
                        <h1 className="text-lg font-black text-white tracking-tight uppercase italic">{examData.title}</h1>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Assessment Matrix</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 md:gap-8">
                    <div className="px-4 py-2 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center gap-3">
                        <Timer className={cn("w-4 h-4", timeLeft < 300 ? "text-red-500 animate-pulse" : "text-zinc-400")} />
                        <span className={cn("font-mono font-black text-lg", timeLeft < 300 ? "text-red-500" : "text-white")}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white font-black uppercase tracking-widest px-8 rounded-xl h-11">
                        {isSubmitting ? <Loader2Icon className="w-4 h-4 animate-spin" /> : "Transmit"}
                    </Button>
                </div>
            </header>

            <main className="flex-1 max-w-4xl mx-auto w-full py-10 px-4 space-y-12 pb-40">
                {/* Intro Card */}
                <div className="bg-zinc-900/40 border border-zinc-900 rounded-[3rem] p-10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-eduGreen-600" />
                    <div className="space-y-4">
                        <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">{examData.title}</h2>
                        <div className="flex flex-wrap gap-4 pt-2">
                            <Badge variant="outline" className="border-zinc-800 text-zinc-500 py-1.5 px-4 font-black uppercase tracking-widest text-[9px]">
                                {examData.subject?.name}
                            </Badge>
                            <Badge variant="outline" className="border-zinc-800 text-eduGreen-500 py-1.5 px-4 font-black uppercase tracking-widest text-[9px]">
                                {examData.questions.length} Nodes
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Adaptive Question Rendering */}
                <div className="space-y-10">
                    {examData.questions.map((q: any, i: number) => (
                        <div key={q.id} className={cn(
                            "group bg-zinc-900/20 border border-zinc-900 rounded-[2.5rem] p-10 transition-all border-l-4",
                            answers[q.id] ? "border-l-eduGreen-500 bg-eduGreen-900/5" : "border-l-zinc-800 hover:bg-zinc-900/30"
                        )}>
                            <div className="space-y-8">
                                <div className="flex items-start gap-6">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg border transition-all flex-shrink-0",
                                        answers[q.id] ? "bg-eduGreen-500 text-black border-eduGreen-400" : "bg-zinc-950 text-zinc-600 border-zinc-800"
                                    )}>
                                        {i + 1}
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-bold text-white leading-tight">{q.text}</h3>
                                        <Badge variant="outline" className="border-zinc-800 text-[8px] uppercase tracking-widest font-black text-zinc-600">
                                            {q.type} • {q.points} Pts
                                        </Badge>
                                    </div>
                                </div>

                                {/* MCQ Renderer */}
                                {q.type === "MCQ" && (
                                    <RadioGroup value={answers[q.id] || ""} onValueChange={(val) => setAnswers({ ...answers, [q.id]: val })} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {q.options?.map((option: string, idx: number) => (
                                            <Label key={idx} className={cn(
                                                "flex items-center p-6 bg-zinc-950 border border-zinc-900 rounded-3xl cursor-pointer transition-all",
                                                "hover:bg-zinc-900 hover:border-zinc-700",
                                                answers[q.id] === option && "bg-eduGreen-950/20 border-eduGreen-500 text-white"
                                            )}>
                                                <RadioGroupItem value={option} className="sr-only" />
                                                <div className={cn("w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center transition-all", answers[q.id] === option ? "bg-eduGreen-500 border-eduGreen-500" : "border-zinc-800")}>
                                                    <div className="w-1.5 h-1.5 bg-black rounded-full" />
                                                </div>
                                                <span className="text-base font-medium">{option}</span>
                                            </Label>
                                        ))}
                                    </RadioGroup>
                                )}

                                {/* SHORT Renderer */}
                                {q.type === "SHORT" && (
                                    <Input
                                        value={answers[q.id] || ""}
                                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                                        placeholder="Type your concise response..."
                                        className="bg-zinc-950 border-zinc-800 h-16 rounded-3xl px-8 text-lg font-medium text-white focus:border-eduGreen-500 transition-all"
                                    />
                                )}

                                {/* LONG Renderer */}
                                {q.type === "LONG" && (
                                    <div className="space-y-2">
                                        <Textarea
                                            value={answers[q.id] || ""}
                                            onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                                            placeholder="Normal writing mode active. Type your detailed response..."
                                            className="bg-zinc-950 border-zinc-800 rounded-[2rem] p-8 text-lg font-medium text-white focus:border-eduGreen-500 transition-all min-h-[300px] leading-relaxed"
                                        />
                                        <div className="flex justify-end pr-4 text-[10px] font-black text-zinc-700 uppercase tracking-widest">
                                            {answers[q.id]?.split(/\s+/).filter(Boolean).length || 0} / {q.minWords || 0} Recommended Words
                                        </div>
                                    </div>
                                )}

                                {/* TF Renderer */}
                                {q.type === "TF" && (
                                    <div className="flex gap-4">
                                        {["True", "False"].map((val) => (
                                            <Button
                                                key={val}
                                                variant="outline"
                                                onClick={() => setAnswers({ ...answers, [q.id]: val })}
                                                className={cn(
                                                    "flex-1 h-16 rounded-3xl font-black uppercase tracking-widest transition-all",
                                                    answers[q.id] === val ? "bg-orange-500/20 border-orange-500 text-orange-500" : "bg-zinc-950 border-zinc-900 text-zinc-600 hover:text-white"
                                                )}
                                            >
                                                {val}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-10 flex flex-col items-center gap-6">
                    <div className="w-20 h-1 bg-zinc-900 rounded-full" />
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="h-20 w-full rounded-[2.5rem] bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-[0.3em] text-xs transition-all shadow-2xl active:scale-95">
                        {isSubmitting ? <Loader2Icon className="w-6 h-6 animate-spin" /> : "Finalize & Transmit Protocol"}
                    </Button>
                </div>
            </main>
        </div>
    );
}

function Loader2({ className }: { className?: string }) {
    return <Loader2Icon className={cn("animate-spin", className)} />;
}
