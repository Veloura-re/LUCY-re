"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, Trash2, ArrowLeft, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { SpringingLoader } from "@/components/dashboard/springing-loader";
import { cn } from "@/lib/utils";

export default function ExamEditorPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [exam, setExam] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);

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

    const addQuestion = () => {
        setQuestions([...questions, {
            id: Date.now().toString(),
            type: "MCQ",
            text: "",
            options: ["", "", "", ""],
            correctOption: 0,
            points: 10
        }]);
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

    const handleSave = async () => {
        try {
            const res = await fetch(`/api/teacher/exams/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questions })
            });
            if (res.ok) {
                toast.success("Exam Structure Saved");
                router.refresh();
            } else {
                toast.error("Save Failed");
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <SpringingLoader message="Loading Assessment Schema" />;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <Button variant="ghost" className="mb-2 pl-0 hover:bg-transparent hover:text-eduGreen-500 transition-colors" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Button>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">{exam?.title}</h1>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Exam Configuration Matrix</p>
                </div>
                <Button onClick={handleSave} className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white font-black uppercase tracking-widest px-8 rounded-xl h-12 shadow-2xl shadow-eduGreen-900/20 active:scale-95 transition-all">
                    <Save className="mr-2 h-4 w-4" /> Save Schema
                </Button>
            </div>

            <div className="space-y-6">
                {questions.map((q, i) => (
                    <Card key={q.id} className="bg-zinc-950/40 border-zinc-900 relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-800 group-hover:bg-eduGreen-500 transition-colors" />
                        <CardContent className="p-8 space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="mt-4 text-zinc-600 cursor-move">
                                    <GripVertical className="w-5 h-5" />
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline" className="bg-zinc-900 text-zinc-500 border-zinc-800 font-black uppercase tracking-widest">Question {i + 1}</Badge>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                value={q.points}
                                                onChange={e => updateQuestion(i, 'points', parseInt(e.target.value))}
                                                className="w-20 bg-zinc-900 border-zinc-800 h-8 text-right font-bold"
                                            />
                                            <span className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Pts</span>
                                            <Button variant="ghost" size="icon" className="text-zinc-600 hover:text-red-500 hover:bg-red-500/10 ml-2" onClick={() => removeQuestion(i)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <Textarea
                                        value={q.text}
                                        onChange={e => updateQuestion(i, 'text', e.target.value)}
                                        placeholder="Enter question stem..."
                                        className="bg-zinc-900/50 border-zinc-800 font-bold text-lg min-h-[100px] resize-none"
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                        {q.options.map((opt: string, optIndex: number) => (
                                            <div key={optIndex} className="flex items-center gap-3">
                                                <div
                                                    className={cn(
                                                        "w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all",
                                                        q.correctOption === optIndex ? "border-eduGreen-500 bg-eduGreen-500 text-black" : "border-zinc-700 bg-transparent text-transparent hover:border-zinc-500"
                                                    )}
                                                    onClick={() => updateQuestion(i, 'correctOption', optIndex)}
                                                >
                                                    <div className="w-2 h-2 rounded-full bg-current" />
                                                </div>
                                                <Input
                                                    value={opt}
                                                    onChange={e => updateOption(i, optIndex, e.target.value)}
                                                    placeholder={`Option ${optIndex + 1}`}
                                                    className={cn(
                                                        "bg-zinc-900/30 border-zinc-800 font-medium",
                                                        q.correctOption === optIndex && "border-eduGreen-900/50 bg-eduGreen-900/10 text-eduGreen-400"
                                                    )}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                <Button onClick={addQuestion} className="w-full h-20 border-2 border-dashed border-zinc-900 bg-transparent hover:bg-zinc-950 hover:border-eduGreen-900/50 text-zinc-600 hover:text-eduGreen-500 font-black uppercase tracking-widest rounded-[2rem] transition-all gap-3">
                    <Plus className="w-5 h-5" /> Add Question Block
                </Button>
            </div>
        </div>
    );
}
