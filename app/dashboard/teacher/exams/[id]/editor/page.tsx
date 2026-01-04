"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Plus, Save, Trash2, ArrowLeft, GripVertical, Image as ImageIcon,
    Loader2, Settings, Eye, ChevronDown, ChevronUp, Copy, Check,
    Type, List, AlignLeft, FileText, CheckCircle2, Sparkles, Zap
} from "lucide-react";
import { toast } from "sonner";
import { SpringingLoader } from "@/components/dashboard/springing-loader";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ExamEditorPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [exam, setExam] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [extracting, setExtracting] = useState(false);
    const [aiText, setAiText] = useState("");
    const [isAiOpen, setIsAiOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchExam();
    }, []);

    const fetchExam = async () => {
        try {
            const res = await fetch(`/api/teacher/exams/${params.id}`);
            const data = await res.json();
            if (data.exam) {
                setExam(data.exam);
                setQuestions(data.exam.questions || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleExtraction = async (source: { image?: string; text?: string }) => {
        setExtracting(true);
        try {
            const res = await fetch(`/api/teacher/exams/extract`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(source)
            });

            const data = await res.json();
            if (data.questions) {
                const newQuestions = data.questions.map((q: any) => ({
                    ...q,
                    id: Math.random().toString(36).substr(2, 9)
                }));
                setQuestions([...questions, ...newQuestions]);
                toast.success(`${newQuestions.length} Questions Integrated`);
                setIsAiOpen(false);
                setAiText("");
            } else {
                toast.error(data.error || "Failed to process input");
            }
        } catch (err) {
            toast.error("Extraction Failed");
        } finally {
            setExtracting(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => handleExtraction({ image: reader.result as string });
    };

    const addQuestion = (type: string = "MCQ") => {
        const base = { id: Date.now().toString(), type, text: "", points: 10 };
        let extra = {};
        if (type === "MCQ") extra = { options: ["", "", "", ""], correctOption: 0 };
        else if (type === "SHORT") extra = { answer: "", keywords: [] };
        else if (type === "LONG") extra = { criteria: "", minWords: 100 };
        else if (type === "TF") extra = { answer: true };

        setQuestions([...questions, { ...base, ...extra }]);
    };

    const updateQuestion = (index: number, updates: any) => {
        const newQs = [...questions];
        newQs[index] = { ...newQs[index], ...updates };
        setQuestions(newQs);
    };

    const updateOption = (qIndex: number, oIndex: number, value: string) => {
        const newQs = [...questions];
        const newOpts = [...newQs[qIndex].options];
        newOpts[oIndex] = value;
        newQs[qIndex] = { ...newQs[qIndex], options: newOpts };
        setQuestions(newQs);
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleRemix = async () => {
        if (questions.length === 0) return toast.error("No questions to remix");
        setExtracting(true);
        try {
            const res = await fetch(`/api/teacher/exams/remix`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questions })
            });
            const data = await res.json();
            if (data.questions) {
                const remixed = data.questions.map((q: any) => ({
                    ...q,
                    id: Math.random().toString(36).substr(2, 9)
                }));
                setQuestions(remixed);
                toast.success("Exam Remixed & Variation Generated");
            } else {
                toast.error("Remixing Failed");
            }
        } catch (err) {
            toast.error("Network Error During Remix");
        } finally {
            setExtracting(false);
        }
    };

    const handleSave = async () => {
        try {
            const totalPoints = questions.reduce((acc, q) => acc + (q.points || 0), 0);
            const res = await fetch(`/api/teacher/exams/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questions,
                    config: { ...exam?.config, maxScore: totalPoints }
                })
            });

            if (res.ok) {
                toast.success(`Assessment Data Saved Successfully`);
                router.refresh();
            } else {
                toast.error("Critical Save Failure");
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <SpringingLoader message="Synthesizing Assessment Data" />;

    return (
        <div className="min-h-screen bg-zinc-950 pb-40">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 px-8 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-zinc-500 hover:text-white">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="text-xl font-black text-white tracking-tight uppercase italic truncate max-w-[200px] md:max-w-md">
                            {exam?.title}
                        </h1>
                    </div>
                    <Button
                        onClick={handleSave}
                        className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white font-black uppercase tracking-widest px-8 rounded-xl h-11 transition-all shadow-lg shadow-eduGreen-900/20"
                    >
                        Publish Update
                    </Button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto pt-10 px-4 space-y-10">
                {/* Stats Card */}
                <div className="bg-zinc-900/40 border border-zinc-900 rounded-[2.5rem] p-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-eduGreen-600" />
                    <div className="flex flex-wrap gap-4">
                        <Badge variant="outline" className="border-zinc-800 text-zinc-500 font-bold uppercase tracking-widest text-[9px] py-1.5 px-4">
                            {exam?.subject?.name}
                        </Badge>
                        <Badge variant="outline" className="border-zinc-800 text-eduGreen-500 font-bold uppercase tracking-widest text-[9px] py-1.5 px-4">
                            {questions.length} Question Nodes
                        </Badge>
                        <Badge variant="outline" className="border-zinc-800 text-white font-bold uppercase tracking-widest text-[9px] py-1.5 px-4">
                            {questions.reduce((acc, q) => acc + (q.points || 0), 0)} Aggregate Marks
                        </Badge>
                    </div>
                </div>

                {/* Question Blocks */}
                <div className="space-y-6">
                    <AnimatePresence>
                        {questions.map((q, i) => (
                            <motion.div
                                key={q.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="group bg-zinc-900/40 border border-zinc-900 rounded-[2.5rem] p-8 relative hover:bg-zinc-900/60 transition-all border-l-4 border-l-zinc-800 hover:border-l-eduGreen-500"
                            >
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <Tabs value={q.type} onValueChange={(val: any) => updateQuestion(i, { type: val })} className="bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                                                <TabsList className="bg-transparent h-8 p-0 gap-1">
                                                    <TabsTrigger value="MCQ" className="h-7 text-[8px] font-black uppercase tracking-widest data-[state=active]:bg-zinc-800 data-[state=active]:text-eduGreen-400"><List className="w-3 h-3 mr-1" /> MCQ</TabsTrigger>
                                                    <TabsTrigger value="SHORT" className="h-7 text-[8px] font-black uppercase tracking-widest data-[state=active]:bg-zinc-800 data-[state=active]:text-blue-400"><AlignLeft className="w-3 h-3 mr-1" /> Short</TabsTrigger>
                                                    <TabsTrigger value="LONG" className="h-7 text-[8px] font-black uppercase tracking-widest data-[state=active]:bg-zinc-800 data-[state=active]:text-purple-400"><FileText className="w-3 h-3 mr-1" /> Essay</TabsTrigger>
                                                    <TabsTrigger value="TF" className="h-7 text-[8px] font-black uppercase tracking-widest data-[state=active]:bg-zinc-800 data-[state=active]:text-orange-400"><CheckCircle2 className="w-3 h-3 mr-1" /> T/F</TabsTrigger>
                                                </TabsList>
                                            </Tabs>
                                            <div className="flex items-center gap-2 bg-zinc-950 h-10 px-4 rounded-xl border border-zinc-800">
                                                <input
                                                    type="number"
                                                    value={q.points}
                                                    onChange={e => updateQuestion(i, { points: parseInt(e.target.value) })}
                                                    className="bg-transparent border-none text-white font-black w-8 text-center text-xs focus:ring-0"
                                                />
                                                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Marks</span>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => removeQuestion(i)} className="text-zinc-700 hover:text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <Textarea
                                        value={q.text}
                                        onChange={e => updateQuestion(i, { text: e.target.value })}
                                        placeholder="Enter the question narrative..."
                                        className="border-none bg-transparent text-xl font-bold text-white p-0 focus-visible:ring-0 placeholder:text-zinc-800 resize-none min-h-[50px] italic"
                                    />

                                    {/* Type Specific Fields */}
                                    {q.type === "MCQ" && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {q.options?.map((opt: string, optIndex: number) => (
                                                <div key={optIndex} className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => updateQuestion(i, { correctOption: optIndex })}
                                                        className={cn(
                                                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                                            q.correctOption === optIndex ? "bg-eduGreen-500 border-eduGreen-500 text-black" : "border-zinc-800 text-transparent hover:border-zinc-700"
                                                        )}
                                                    >
                                                        <Check className="w-3 h-3 stroke-[4]" />
                                                    </button>
                                                    <Input
                                                        value={opt}
                                                        onChange={e => updateOption(i, optIndex, e.target.value)}
                                                        placeholder={`Choice ${String.fromCharCode(65 + optIndex)}`}
                                                        className={cn(
                                                            "bg-zinc-950/50 border-zinc-800 rounded-2xl h-12 font-medium text-sm transition-all focus:border-eduGreen-600",
                                                            q.correctOption === optIndex && "border-eduGreen-900/30 bg-eduGreen-950/20 text-white"
                                                        )}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {q.type === "SHORT" && (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-2">Correct Answer Matrix</label>
                                                <Input
                                                    value={q.answer}
                                                    onChange={e => updateQuestion(i, { answer: e.target.value })}
                                                    placeholder="The primary correct response"
                                                    className="bg-zinc-950 border-zinc-800 rounded-2xl h-14 font-bold text-blue-500 px-6 focus:border-blue-600 transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-2">Keyword Logic (Comma Separated)</label>
                                                <Input
                                                    value={q.keywords?.join(", ")}
                                                    onChange={e => updateQuestion(i, { keywords: e.target.value.split(",").map(k => k.trim()) })}
                                                    placeholder="essential, terminology, required"
                                                    className="bg-zinc-950/50 border-zinc-800 rounded-2xl h-12 font-medium text-xs px-6"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {q.type === "LONG" && (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-2">Grading Intelligence Criteria</label>
                                                <Textarea
                                                    value={q.criteria}
                                                    onChange={e => updateQuestion(i, { criteria: e.target.value })}
                                                    placeholder="Instructions for AI grading (e.g., Check for 3 pillars of sustainability...)"
                                                    className="bg-zinc-950 border-zinc-800 rounded-2xl h-32 font-medium text-xs px-6 py-4 resize-none"
                                                />
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="bg-zinc-950 p-2 px-6 rounded-2xl border border-zinc-800 flex items-center gap-3">
                                                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Min Words</span>
                                                    <input
                                                        type="number"
                                                        value={q.minWords}
                                                        onChange={e => updateQuestion(i, { minWords: parseInt(e.target.value) })}
                                                        className="bg-transparent border-none text-white font-black w-12 text-xs focus:ring-0"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {q.type === "TF" && (
                                        <div className="flex items-center gap-4">
                                            <Button
                                                variant="outline"
                                                onClick={() => updateQuestion(i, { answer: true })}
                                                className={cn(
                                                    "flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs transition-all",
                                                    q.answer === true ? "bg-orange-500/20 border-orange-500 text-orange-500" : "bg-zinc-950 border-zinc-900 text-zinc-600 hover:text-white"
                                                )}
                                            >
                                                True
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => updateQuestion(i, { answer: false })}
                                                className={cn(
                                                    "flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs transition-all",
                                                    q.answer === false ? "bg-orange-500/20 border-orange-500 text-orange-500" : "bg-zinc-950 border-zinc-900 text-zinc-600 hover:text-white"
                                                )}
                                            >
                                                False
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Vertical Toolbar */}
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-zinc-900/90 backdrop-blur-3xl border border-zinc-800 p-3 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50">
                    <Button
                        onClick={() => addQuestion()}
                        className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white h-14 w-14 rounded-3xl shadow-xl transition-all hover:scale-110 active:scale-95"
                    >
                        <Plus className="w-6 h-6" />
                    </Button>

                    <div className="w-[1px] h-8 bg-zinc-800 mx-2" />

                    <Button
                        onClick={handleRemix}
                        disabled={extracting}
                        className="bg-zinc-950 hover:bg-zinc-800 text-amber-500 h-14 px-6 rounded-[2rem] border border-zinc-800 shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                    >
                        {extracting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Remix</span>
                    </Button>

                    <Dialog open={isAiOpen} onOpenChange={setIsAiOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-zinc-950 hover:bg-zinc-800 text-purple-400 h-14 px-6 rounded-[2rem] border border-zinc-800 shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3">
                                <FileText className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Neural Write</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-950 border-zinc-900 rounded-[3rem] p-12 max-w-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-4xl font-black text-white italic uppercase italic mb-2">Cognitive Synthesis</DialogTitle>
                                <DialogDescription className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Convert drafts into valid assessment nodes</DialogDescription>
                            </DialogHeader>
                            <Textarea
                                value={aiText}
                                onChange={e => setAiText(e.target.value)}
                                placeholder="Paste your lesson overview or raw question list here..."
                                className="bg-zinc-900/50 border-zinc-800 rounded-3xl h-64 p-8 font-medium text-lg text-zinc-300 focus:border-purple-600 transition-all resize-none shadow-inner"
                            />
                            <Button
                                disabled={extracting || !aiText}
                                onClick={() => handleExtraction({ text: aiText })}
                                className="h-18 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-[0.3em] rounded-3xl shadow-2xl transition-all active:scale-95"
                            >
                                {extracting ? <Loader2 className="w-6 h-6 animate-spin mr-3" /> : <Zap className="w-5 h-5 mr-3" />}
                                Begin Transcription
                            </Button>
                        </DialogContent>
                    </Dialog>

                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    <Button
                        disabled={extracting}
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-zinc-950 hover:bg-zinc-800 text-white h-14 px-6 rounded-[2rem] border border-zinc-800 shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                    >
                        {extracting ? <Loader2 className="w-5 h-5 animate-spin text-eduGreen-500" /> : <ImageIcon className="w-5 h-5 text-eduGreen-500" />}
                        <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Scan Paper</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
