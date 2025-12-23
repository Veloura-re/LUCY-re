"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Timer, AlertTriangle, ShieldAlert, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Mock Exam Data
const EXAM_DATA = {
    id: "exam-456",
    title: "Quantum Mechanics Unit Test",
    duration: 120, // minutes
    questions: [
        {
            id: 1,
            text: "Which of the following describes the behavior of a particle in a box?",
            options: [
                "The particle can be found anywhere with equal probability.",
                "The energy levels are continuous.",
                "The energy levels are quantized.",
                "The particle is at rest."
            ]
        },
        {
            id: 2,
            text: "What is the physical interpretation of the square of the wave function |ψ(x)|²?",
            options: [
                "Momentum density",
                "Probability density",
                "Energy density",
                "Charge density"
            ]
        },
        {
            id: 3,
            text: "Heisenberg's Uncertainty Principle states that:",
            options: [
                "Energy and time cannot be measured simultaneously with arbitrary precision.",
                "Position and momentum cannot be measured simultaneously with arbitrary precision.",
                "Both A and B.",
                "None of the above."
            ]
        }
    ]
};

export default function ExamRoomPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(EXAM_DATA.duration * 60);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [warnings, setWarnings] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial Load
    useEffect(() => {
        setTimeout(() => setLoading(false), 1500);
    }, []);

    // Timer
    useEffect(() => {
        if (loading) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit(); // Auto-submit
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [loading]);

    // Anti-Cheat: Visibility Change
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setWarnings((prev) => prev + 1);
                toast.error("Warning: Implementation of Focus Loss Detected.", {
                    description: "This incident has been logged. Continued deviation will result in protocol termination.",
                    icon: <ShieldAlert className="w-5 h-5 text-red-500" />,
                    duration: 5000,
                });
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, []);

    const handleAnswer = (val: string) => {
        setAnswers({ ...answers, [EXAM_DATA.questions[currentQuestion].id]: val });
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        router.push("/dashboard/student/exams?status=completed");
        toast.success("Assessment Protocol Concluded. Data Uplink Secure.");
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
                <Spinner className="w-12 h-12 text-eduGreen-500" />
                <p className="text-zinc-500 font-black uppercase tracking-widest text-xs animate-pulse">Establishing Secure Uplink...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            {/* Top Bar */}
            <header className="h-20 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between px-8 z-50">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-eduGreen-900/20 rounded-xl flex items-center justify-center border border-eduGreen-500/20">
                        <ShieldAlert className="w-5 h-5 text-eduGreen-500" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-white tracking-tight">{EXAM_DATA.title}</h1>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Secure Environment Active</p>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    {warnings > 0 && (
                        <div className="flex items-center gap-2 text-red-500 animate-pulse">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-xs font-black uppercase tracking-widest">{warnings} Flag(s) Detected</span>
                        </div>
                    )}

                    <div className="px-6 py-2 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center gap-3">
                        <Timer className={cn("w-4 h-4", timeLeft < 300 ? "text-red-500 animate-pulse" : "text-zinc-400")} />
                        <span className={cn("font-mono font-bold text-xl", timeLeft < 300 ? "text-red-500" : "text-white")}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>

                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white font-black uppercase tracking-widest px-8 rounded-xl"
                    >
                        {isSubmitting ? <Spinner className="w-4 h-4" /> : "Submit Assessment"}
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden relative flex">
                {/* Question Navigation */}
                <aside className="w-20 md:w-24 bg-zinc-950/50 border-r border-zinc-900 flex flex-col items-center py-8 gap-4 overflow-y-auto">
                    {EXAM_DATA.questions.map((q, idx) => (
                        <button
                            key={q.id}
                            onClick={() => setCurrentQuestion(idx)}
                            className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all relative",
                                currentQuestion === idx
                                    ? "bg-eduGreen-500 text-black shadow-[0_0_15px_rgba(20,184,115,0.4)] scale-110"
                                    : answers[q.id]
                                        ? "bg-zinc-800 text-eduGreen-500 border border-eduGreen-900/50"
                                        : "bg-zinc-900 text-zinc-600 hover:bg-zinc-800"
                            )}
                        >
                            {idx + 1}
                            {answers[q.id] && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-eduGreen-500 rounded-full border-2 border-zinc-950" />}
                        </button>
                    ))}
                </aside>

                {/* Question Area */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-20 relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,184,115,0.03),transparent_70%)] pointer-events-none" />

                    <div className="w-full max-w-3xl space-y-12 relative z-10">
                        <div className="space-y-4">
                            <span className="text-zinc-500 font-black uppercase tracking-[0.2em] text-xs">
                                Question {currentQuestion + 1} of {EXAM_DATA.questions.length}
                            </span>
                            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                                {EXAM_DATA.questions[currentQuestion].text}
                            </h2>
                        </div>

                        <RadioGroup
                            value={answers[EXAM_DATA.questions[currentQuestion].id] || ""}
                            onValueChange={handleAnswer}
                            className="space-y-4"
                        >
                            {EXAM_DATA.questions[currentQuestion].options.map((option, idx) => (
                                <div key={idx} className="relative">
                                    <RadioGroupItem value={option} id={`opt-${idx}`} className="peer sr-only" />
                                    <Label
                                        htmlFor={`opt-${idx}`}
                                        className="flex items-center p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl cursor-pointer hover:bg-zinc-900/60 hover:border-zinc-700 peer-checked:bg-eduGreen-950/20 peer-checked:border-eduGreen-500 peer-checked:text-white text-zinc-400 font-medium transition-all group"
                                    >
                                        <div className="w-6 h-6 rounded-full border border-zinc-700 mr-4 flex items-center justify-center peer-checked:border-eduGreen-500 peer-checked:bg-eduGreen-500 group-peer-checked:scale-110 transition-all">
                                            <div className="w-2 h-2 bg-black rounded-full opacity-0 peer-checked:opacity-100" />
                                        </div>
                                        <span className="text-lg">{option}</span>
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>

                        <div className="flex items-center justify-between pt-10 border-t border-zinc-900/50">
                            <Button
                                variant="ghost"
                                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                                disabled={currentQuestion === 0}
                                className="text-zinc-500 hover:text-white font-black uppercase tracking-widest"
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setCurrentQuestion(Math.min(EXAM_DATA.questions.length - 1, currentQuestion + 1))}
                                disabled={currentQuestion === EXAM_DATA.questions.length - 1}
                                className="text-zinc-500 hover:text-white font-black uppercase tracking-widest"
                            >
                                Next <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function Spinner({ className }: { className?: string }) {
    return <Loader2 className={cn("animate-spin", className)} />;
}
