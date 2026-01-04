"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Plus, Save, Trash2, ArrowLeft, GripVertical,
    Image as ImageIcon, Loader2, Settings, Eye,
    ChevronDown, ChevronUp, Copy, Check, Sparkles, Zap, FileText, ArrowRight,
    List, AlignLeft
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function CreateExamPage() {
    const router = useRouter();
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [extracting, setExtracting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form State
    const searchParams = useSearchParams();
    const [title, setTitle] = useState("");
    const [classId, setClassId] = useState("");
    const [subjectId, setSubjectId] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [questions, setQuestions] = useState<any[]>([]);
    const [selectedSubjects, setSelectedSubjects] = useState<any[]>([]);
    const [isAiOpen, setIsAiOpen] = useState(false);
    const [aiText, setAiText] = useState("");
    const [aiMode, setAiMode] = useState("MIXED");
    const [aiCount, setAiCount] = useState(5);
    const [aiDifficulty, setAiDifficulty] = useState("INTERMEDIATE");
    const [aiAllowedTypes, setAiAllowedTypes] = useState<string[]>([]);

    useEffect(() => {
        fetchClasses();
        if (searchParams.get('mode') === 'ai') {
            setIsAiOpen(true);
        }
    }, [searchParams]);

    const fetchClasses = async () => {
        try {
            const res = await fetch('/api/teacher/classes');
            const data = await res.json();
            if (data.classes) setClasses(data.classes);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleClassChange = (id: string) => {
        setClassId(id);
        const subjects = classes
            .filter(c => c.classId === id)
            .map(c => ({ id: c.subjectId || "sub-1", name: c.subjectName }));
        // Dedupe
        const unique = subjects.filter((s, i, a) => a.findIndex(t => t.name === s.name) === i);
        setSelectedSubjects(unique);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setExtracting(true);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            try {
                const base64 = reader.result as string;
                const res = await fetch(`/api/teacher/exams/extract`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: base64 })
                });

                const data = await res.json();
                if (data.questions) {
                    const newQuestions = data.questions.map((q: any) => ({
                        ...q,
                        id: Date.now() + Math.random().toString(36).substr(2, 9)
                    }));
                    setQuestions([...questions, ...newQuestions]);
                    toast.success(`${newQuestions.length} Questions Extracted`);
                } else {
                    toast.error(data.error || "Failed to extract questions");
                }
            } catch (err) {
                toast.error("Extraction Failed");
            } finally {
                setExtracting(false);
            }
        };
    };

    const addQuestion = (type: string = "MCQ") => {
        const base = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            type,
            text: "",
            points: type === "LONG" ? 20 : 10
        };

        let extra = {};
        if (type === "MCQ") extra = { options: ["", "", "", ""], correctOption: 0 };
        else if (type === "SHORT") extra = { answer: "", keywords: [] };
        else if (type === "LONG") extra = { criteria: "", minWords: 100 };
        else if (type === "TF") extra = { answer: true };

        setQuestions([...questions, { ...base, ...extra }]);
    };

    const updateQuestion = (index: number, field: string, value: any) => {
        const newQs = [...questions];
        newQs[index] = { ...newQs[index], [field]: value };
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

    const handleAiDraft = async () => {
        if (!aiText.trim()) return;
        setExtracting(true);
        try {
            const res = await fetch(`/api/teacher/exams/extract`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: aiText,
                    mode: aiMode,
                    count: aiCount,
                    difficulty: aiDifficulty,
                    allowedTypes: aiAllowedTypes
                })
            });
            const data = await res.json();
            if (data.questions) {
                const newQs = data.questions.map((q: any) => ({
                    ...q,
                    id: Date.now() + Math.random().toString(36).substr(2, 9)
                }));
                setQuestions([...questions, ...newQs]);
                toast.success(`${newQs.length} Questions Synthesized`);
                setIsAiOpen(false);
                setAiText("");
            }
        } catch (e) {
            toast.error("Neural Synthesis Failed");
        } finally {
            setExtracting(false);
        }
    };

    const handleSave = async () => {
        if (!title || !classId || !subjectId) {
            toast.error("Please fill in basic exam info first.");
            return;
        }

        try {
            const totalPoints = questions.reduce((acc, q) => acc + (q.points || 0), 0);
            const res = await fetch(`/api/teacher/exams`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    classId,
                    subjectId,
                    date: dueDate,
                    maxScore: totalPoints,
                    questions
                })
            });

            const data = await res.json();
            if (res.ok) {
                // Now also update the questions via PATCH (or the POST handles it? The current POST doesn't save questions)
                // Let's check api/teacher/exams/route.ts.
                // It only creates basic info. I need to update it to handle questions or call PATCH immediately.
                // Better: Update the POST to handle everything.

                // If I can't update API easily right now, I'll call PATCH.
                await fetch(`/api/teacher/exams/${data.exam.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ questions, config: { maxScore: totalPoints } })
                });

                toast.success("Exam Created Successfully!");
                router.push('/dashboard/teacher/exams');
            } else {
                toast.error("Creation Failed");
            }
        } catch (e) {
            toast.error("Error creating exam.");
        }
    };

    if (loading) return null;

    return (
        <div className="min-h-screen bg-zinc-950 pb-40">
            {/* Google Forms Style Header */}
            <div className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 px-8 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-zinc-500 hover:text-white">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="text-xl font-black text-white tracking-tight uppercase italic truncate max-w-[200px] md:max-w-md">
                            {title || "Untitled Assessment"}
                        </h1>
                        <Badge variant="outline" className="hidden md:flex border-zinc-800 text-zinc-500 font-black uppercase tracking-widest text-[8px]">
                            Draft Protocol
                        </Badge>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-eduGreen-500 hidden md:flex">
                            <Eye className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-eduGreen-500 hidden md:flex">
                            <Settings className="w-5 h-5" />
                        </Button>
                        <Button
                            onClick={handleSave}
                            className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white font-black uppercase tracking-widest px-8 rounded-xl h-11 transition-all shadow-lg shadow-eduGreen-900/20"
                        >
                            Publish
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto pt-10 px-4 space-y-6">
                {/* Meta Information Card */}
                <div className="bg-zinc-900/40 border border-zinc-900 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                    <div className="absolute top-0 left-0 w-full h-2 bg-eduGreen-600" />
                    <div className="p-10 space-y-10">
                        <div className="space-y-2">
                            <Input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Assessment Title"
                                className="border-none bg-transparent text-4xl font-black text-white h-auto p-0 focus-visible:ring-0 placeholder:text-zinc-800 italic uppercase"
                            />
                            <div className="h-[1px] bg-zinc-800 w-full" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Target Class</label>
                                <Select onValueChange={handleClassChange}>
                                    <SelectTrigger className="h-12 bg-zinc-950/50 border-zinc-800 rounded-xl px-4 font-bold text-white focus:ring-0 focus:border-eduGreen-600 transition-all">
                                        <SelectValue placeholder="Select Class" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-950 border-zinc-900 rounded-xl">
                                        {classes.filter((c, i, a) => a.findIndex(t => t.classId === c.classId) === i).map((cls) => (
                                            <SelectItem key={cls.classId} value={cls.classId} className="hover:bg-zinc-900 py-3 font-bold uppercase tracking-widest text-[10px]">
                                                {cls.className}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Subject</label>
                                <Select onValueChange={setSubjectId}>
                                    <SelectTrigger className="h-12 bg-zinc-950/50 border-zinc-800 rounded-xl px-4 font-bold text-white focus:ring-0 focus:border-eduGreen-600 transition-all">
                                        <SelectValue placeholder="Select Subject" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-950 border-zinc-900 rounded-xl">
                                        {selectedSubjects.map((s: any) => (
                                            <SelectItem key={s.id} value={s.id} className="hover:bg-zinc-900 py-3 font-bold uppercase tracking-widest text-[10px]">
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Due Date</label>
                                <Input
                                    type="date"
                                    value={dueDate}
                                    onChange={e => setDueDate(e.target.value)}
                                    className="h-12 bg-zinc-950/50 border-zinc-800 rounded-xl px-4 font-bold text-white focus:ring-1 focus:ring-eduGreen-600 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pedagogical Protocol Palette */}
                {questions.length === 0 && !extracting && (
                    <div className="space-y-12 py-10">
                        <div className="space-y-2 text-center md:text-left">
                            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Choose Your <span className="text-eduGreen-500 not-italic">Creation Protocol</span></h2>
                            <p className="text-zinc-600 font-bold uppercase tracking-[0.2em] text-[10px]">Specify the pedagogical DNA of your assessment</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group cursor-pointer"
                                onClick={() => {
                                    setTitle("MCQ Assessment Protocol");
                                    addQuestion(); // MCQ is default
                                }}
                            >
                                <Card className="bg-zinc-900/40 border-zinc-900 rounded-[2.5rem] p-8 transition-all hover:border-eduGreen-500/50 hover:bg-zinc-900/60 h-full relative overflow-hidden flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <div className="w-12 h-12 bg-eduGreen-950/20 border border-eduGreen-900/30 rounded-2xl flex items-center justify-center text-eduGreen-500">
                                            <List className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white italic uppercase">Classic MCQs</h3>
                                            <p className="text-zinc-600 font-black text-[8px] mt-1 uppercase tracking-widest">Fact Retrieval • Precise Scoring</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" className="mt-8 text-zinc-500 group-hover:text-eduGreen-500 font-black text-[9px] uppercase tracking-widest p-0 justify-start">
                                        Initialize Protocol <Plus className="ml-2 w-3 h-3" />
                                    </Button>
                                </Card>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="group cursor-pointer"
                                onClick={() => {
                                    setTitle("Critical Reasoning Assessment");
                                    setQuestions([{ id: Date.now().toString(), type: "LONG", text: "", points: 20, criteria: "", minWords: 100 }]);
                                }}
                            >
                                <Card className="bg-zinc-900/40 border-zinc-900 rounded-[2.5rem] p-8 transition-all hover:border-amber-500/50 hover:bg-zinc-900/60 h-full relative overflow-hidden flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <div className="w-12 h-12 bg-amber-950/20 border border-amber-900/30 rounded-2xl flex items-center justify-center text-amber-500">
                                            <AlignLeft className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white italic uppercase">Reasoning Suite</h3>
                                            <p className="text-zinc-600 font-black text-[8px] mt-1 uppercase tracking-widest">Depth of Thought • Analysis</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" className="mt-8 text-zinc-500 group-hover:text-amber-500 font-black text-[9px] uppercase tracking-widest p-0 justify-start">
                                        Begin Analysis <Plus className="ml-2 w-3 h-3" />
                                    </Button>
                                </Card>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="group cursor-pointer"
                                onClick={() => setIsAiOpen(true)}
                            >
                                <Card className="bg-zinc-900/40 border-zinc-900 rounded-[2.5rem] p-8 transition-all hover:border-purple-500/50 hover:bg-zinc-900/60 h-full relative overflow-hidden flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <div className="w-12 h-12 bg-purple-950/20 border border-purple-900/30 rounded-2xl flex items-center justify-center text-purple-400">
                                            <Sparkles className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white italic uppercase">Neural Synthesis</h3>
                                            <p className="text-zinc-600 font-black text-[8px] mt-1 uppercase tracking-widest">AI Assisted • Topic Driven</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" className="mt-8 text-zinc-500 group-hover:text-purple-400 font-black text-[9px] uppercase tracking-widest p-0 justify-start">
                                        Activate AI <Plus className="ml-2 w-3 h-3" />
                                    </Button>
                                </Card>
                            </motion.div>
                        </div>
                    </div>
                )}

                {/* Questions List */}
                <div className="space-y-6">
                    <AnimatePresence>
                        {questions.map((q, i) => (
                            <motion.div
                                key={q.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="group bg-zinc-900/30 border border-zinc-900 rounded-[2rem] p-8 relative hover:bg-zinc-900/50 transition-all"
                            >
                                <div className="absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <GripVertical className="w-6 h-6 text-zinc-700" />
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-start justify-between">
                                        <Badge variant="outline" className="border-zinc-800 text-zinc-600 font-black uppercase tracking-tighter text-[10px]">
                                            Q {i + 1} • {q.points} PTS
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeQuestion(i)}
                                            className="text-zinc-700 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <Textarea
                                        value={q.text}
                                        onChange={e => updateQuestion(i, 'text', e.target.value)}
                                        placeholder="Question Stem..."
                                        className="border-none bg-transparent text-xl font-bold text-white p-0 focus-visible:ring-0 placeholder:text-zinc-800 resize-none min-h-[60px]"
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {q.options.map((opt: string, optIndex: number) => (
                                            <div key={optIndex} className="flex items-center gap-3 group/opt">
                                                <button
                                                    onClick={() => updateQuestion(i, 'correctOption', optIndex)}
                                                    className={cn(
                                                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                                        q.correctOption === optIndex
                                                            ? "bg-eduGreen-500 border-eduGreen-500 text-black shadow-[0_0_10px_rgba(20,184,115,0.3)]"
                                                            : "border-zinc-800 text-transparent hover:border-zinc-600"
                                                    )}
                                                >
                                                    <Check className="w-3 h-3 stroke-[4]" />
                                                </button>
                                                <Input
                                                    value={opt}
                                                    onChange={e => updateOption(i, optIndex, e.target.value)}
                                                    placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                                    className={cn(
                                                        "bg-zinc-950/40 border-zinc-900 rounded-xl h-11 font-medium text-sm transition-all",
                                                        q.correctOption === optIndex && "border-eduGreen-900/30 bg-eduGreen-950/20"
                                                    )}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Floating Action Menu */}
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 p-2 rounded-full shadow-2xl z-50">
                    <Button
                        onClick={() => addQuestion()}
                        className="bg-zinc-950 hover:bg-zinc-800 text-eduGreen-500 h-14 w-14 rounded-full border border-zinc-800 shadow-xl transition-all hover:scale-110 active:scale-90"
                    >
                        <Plus className="w-6 h-6" />
                    </Button>
                    <div className="w-[1px] h-8 bg-zinc-800 mx-1" />
                    <div className="w-[1px] h-8 bg-zinc-800 mx-1" />

                    <Dialog open={isAiOpen} onOpenChange={setIsAiOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-zinc-950 hover:bg-zinc-800 text-purple-400 h-14 px-6 rounded-full border border-zinc-800 shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3">
                                <FileText className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Neural Write</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-950 border-zinc-900 text-white rounded-[2rem] max-w-2xl p-0 overflow-hidden shadow-2xl">
                            <Tabs defaultValue="draft" className="w-full">
                                <TabsList className="w-full h-12 bg-zinc-900/50 border-b border-zinc-800 rounded-none p-0 flex">
                                    <TabsTrigger value="draft" className="flex-1 rounded-none data-[state=active]:bg-zinc-900 border-none font-black text-[9px] uppercase tracking-widest text-zinc-500 data-[state=active]:text-purple-400">
                                        Neural Draft
                                    </TabsTrigger>
                                    <TabsTrigger value="guide" className="flex-1 rounded-none data-[state=active]:bg-zinc-900 border-none font-black text-[9px] uppercase tracking-widest text-zinc-500 data-[state=active]:text-purple-400">
                                        How it Works
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="draft" className="m-0 focus-visible:ring-0">
                                    <DialogHeader className="p-8 bg-zinc-900/10">
                                        <DialogTitle className="text-2xl font-black italic uppercase flex items-center gap-3">
                                            <Sparkles className="w-6 h-6 text-purple-500" /> Neural Architect
                                        </DialogTitle>
                                        <DialogDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[9px]">
                                            Synthesizing Assessment Protocol from Raw Data
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="px-8 pb-8 space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[8px] font-black text-zinc-700 uppercase tracking-widest ml-1">Synthesis Mode</label>
                                                <Select value={aiMode} onValueChange={setAiMode}>
                                                    <SelectTrigger className="h-11 bg-zinc-900 border-zinc-800 rounded-xl font-bold text-[10px] uppercase tracking-widest">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-zinc-950 border-zinc-900 rounded-xl">
                                                        <SelectItem value="MIXED" className="text-[9px] font-black uppercase tracking-widest">Standard Mixed</SelectItem>
                                                        <SelectItem value="RECALL" className="text-[9px] font-black uppercase tracking-widest">Fact Retrieval</SelectItem>
                                                        <SelectItem value="CRITICAL_THINKING" className="text-[9px] font-black uppercase tracking-widest">Analytical Depth</SelectItem>
                                                        <SelectItem value="REVISION" className="text-[9px] font-black uppercase tracking-widest">Curriculum Sweep</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[8px] font-black text-zinc-700 uppercase tracking-widest ml-1">Difficulty Tier</label>
                                                <Select value={aiDifficulty} onValueChange={setAiDifficulty}>
                                                    <SelectTrigger className="h-11 bg-zinc-900 border-zinc-800 rounded-xl font-bold text-[10px] uppercase tracking-widest">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-zinc-950 border-zinc-900 rounded-xl">
                                                        <SelectItem value="BASIC" className="text-[9px] font-black uppercase tracking-widest">Foundation</SelectItem>
                                                        <SelectItem value="INTERMEDIATE" className="text-[9px] font-black uppercase tracking-widest">Core Competency</SelectItem>
                                                        <SelectItem value="ADVANCED" className="text-[9px] font-black uppercase tracking-widest">Mastery Level</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[8px] font-black text-zinc-700 uppercase tracking-widest ml-1">Type Targeting</label>
                                            <div className="flex flex-wrap gap-2">
                                                {["MCQ", "SHORT", "LONG", "TF"].map(type => (
                                                    <button
                                                        key={type}
                                                        onClick={() => {
                                                            setAiAllowedTypes(prev =>
                                                                prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                                                            );
                                                        }}
                                                        className={cn(
                                                            "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border",
                                                            aiAllowedTypes.includes(type)
                                                                ? "bg-purple-600 border-purple-500 text-white"
                                                                : "bg-zinc-900 border-zinc-800 text-zinc-600 hover:border-zinc-700"
                                                        )}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
                                                {aiAllowedTypes.length > 0 && (
                                                    <button
                                                        onClick={() => setAiAllowedTypes([])}
                                                        className="px-3 py-1.5 text-[8px] font-black uppercase text-zinc-700 hover:text-white"
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <Textarea
                                            value={aiText}
                                            onChange={e => setAiText(e.target.value)}
                                            placeholder="Paste lecture notes, textbook snippets, or topics here..."
                                            className="min-h-[160px] bg-zinc-900 border-zinc-800 rounded-2xl p-6 font-medium text-dm-textMain focus:ring-purple-500 transition-all placeholder:text-zinc-800"
                                        />

                                        <div className="flex items-center justify-between pt-2">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Quantum Count:</span>
                                                <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                                                    {[3, 5, 10].map(n => (
                                                        <button
                                                            key={n}
                                                            onClick={() => setAiCount(n)}
                                                            className={cn(
                                                                "px-3 py-1 rounded-md text-[9px] font-black transition-all",
                                                                aiCount === n ? "bg-purple-600 text-white shadow-lg" : "text-zinc-600 hover:text-zinc-400"
                                                            )}
                                                        >
                                                            {n}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <Button
                                                onClick={handleAiDraft}
                                                disabled={extracting || !aiText.trim()}
                                                className="bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-widest px-8 h-12 rounded-xl shadow-xl shadow-purple-900/20 transition-all active:scale-95 gap-2"
                                            >
                                                {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                                Synthesize
                                            </Button>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="guide" className="m-0 focus-visible:ring-0">
                                    <div className="p-10 space-y-8">
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-black text-white italic uppercase">How it Works</h3>
                                            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Mastering the Neural Architect</p>
                                        </div>

                                        <div className="space-y-6">
                                            {[
                                                { step: "01", title: "Data Ingestion", desc: "Paste your raw notes, transcripts, or specific curriculum topics into the terminal." },
                                                { step: "02", title: "Intent Selection", desc: "Choose a mode. 'Analytical depth' focuses on essay-style reasoning, while 'Recall' targets facts." },
                                                { step: "03", title: "Synthesis", desc: "LUCY processes the data and generates a formal assessment schema ready for review." }
                                            ].map((s, idx) => (
                                                <div key={idx} className="flex gap-6 items-start">
                                                    <div className="text-2xl font-black text-zinc-900 leading-none">{s.step}</div>
                                                    <div className="space-y-1">
                                                        <p className="text-white font-black text-sm uppercase tracking-tight">{s.title}</p>
                                                        <p className="text-zinc-600 text-[10px] font-bold leading-relaxed">{s.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="p-6 bg-purple-950/10 border border-purple-900/20 rounded-2xl flex items-center gap-4">
                                            <Sparkles className="w-10 h-10 text-purple-600 opacity-50" />
                                            <p className="text-purple-200/50 text-[9px] font-bold uppercase tracking-widest leading-relaxed">
                                                Pro-tip: Provide clear headings and bullet points in your source text for 30% higher synthesis accuracy.
                                            </p>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </DialogContent>
                    </Dialog>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                    />
                    <Button
                        disabled={extracting}
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-zinc-950 hover:bg-zinc-800 text-zinc-400 h-14 px-6 rounded-full border border-zinc-800 shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                    >
                        {extracting ? <Loader2 className="w-5 h-5 animate-spin text-eduGreen-500" /> : <ImageIcon className="w-5 h-5" />}
                        <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">
                            {extracting ? "Scanning..." : "Scan Image"}
                        </span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
