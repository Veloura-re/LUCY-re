import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface GradeStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: any;
}

export function GradeStudentModal({ isOpen, onClose, student }: GradeStudentModalProps) {
    const [exams, setExams] = useState<any[]>([]);
    const [selectedExamId, setSelectedExamId] = useState("");
    const [score, setScore] = useState("");
    const [remark, setRemark] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetchingExams, setFetchingExams] = useState(false);

    useEffect(() => {
        if (isOpen && student?.classId) {
            fetchExams();
        }
    }, [isOpen, student]);

    const getPerformanceColor = (pct: number) => {
        if (pct >= 80) return "text-emerald-500";
        if (pct >= 60) return "text-blue-500";
        if (pct >= 40) return "text-amber-500";
        return "text-rose-500";
    };

    const fetchExams = async () => {
        setFetchingExams(true);
        try {
            // Fetch exams for this student's class
            const res = await fetch(`/api/school/marklists?classId=${student.classId}`);
            const data = await res.json();
            if (data.exams) {
                // Filter out locked exams if necessary, though backend handles submission rejection
                setExams(data.exams);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setFetchingExams(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedExamId || !score) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/school/marklists/${selectedExamId}/marks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    marks: [{
                        studentId: student.id,
                        score: parseFloat(score),
                        remark: remark
                    }]
                })
            });

            if (res.ok) {
                onClose();
                // Optional: Show success toast
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const selectedExam = exams.find(e => e.id === selectedExamId);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-zinc-950 border-zinc-900 text-white max-w-md rounded-[2.5rem]">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-eduGreen-900/20 flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-eduGreen-500" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black italic">Grade Student</DialogTitle>
                            <DialogDescription className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
                                {student?.firstName} {student?.lastName}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Select Assessment</label>
                            <Select onValueChange={setSelectedExamId} value={selectedExamId}>
                                <SelectTrigger className="h-12 rounded-xl bg-zinc-900 border-zinc-800 text-white">
                                    <SelectValue placeholder={fetchingExams ? "Loading assessments..." : "Choose Exam..."} />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-950 border-zinc-800 text-white max-h-[300px]">
                                    {exams.map(exam => (
                                        <SelectItem key={exam.id} value={exam.id}>
                                            <span className="font-bold">{exam.subject.name}</span> - {exam.title}
                                        </SelectItem>
                                    ))}
                                    {exams.length === 0 && !fetchingExams && (
                                        <div className="p-2 text-[10px] text-zinc-500 text-center uppercase font-bold">No active assessments found</div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Score Attained</label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        step="0.1"
                                        placeholder="0"
                                        value={score}
                                        onChange={e => setScore(e.target.value)}
                                        className="bg-zinc-900 border-zinc-800 text-white h-12 rounded-xl text-lg font-black pl-4"
                                    />
                                    {selectedExam && (
                                        <div className="absolute right-3 top-3 text-[10px] font-bold text-zinc-600">
                                            / {selectedExam.totalMarks}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Percentage</label>
                                <div className={cn(
                                    "h-12 flex items-center px-4 bg-zinc-900/50 border border-zinc-800 rounded-xl font-mono text-sm",
                                    score && selectedExam ? getPerformanceColor((parseFloat(score) / selectedExam.totalMarks) * 100) : "text-zinc-500"
                                )}>
                                    {score && selectedExam ? Math.round((parseFloat(score) / selectedExam.totalMarks) * 100) + '%' : '-'}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Instructor Remark (Optional)</label>
                            <Input
                                placeholder="Brief observation..."
                                value={remark}
                                onChange={e => setRemark(e.target.value)}
                                className="bg-zinc-900 border-zinc-800 text-white h-12 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-zinc-900/50">
                        <Button type="button" variant="ghost" onClick={onClose} className="text-zinc-500 hover:text-white font-black uppercase text-[10px] tracking-widest">Cancel</Button>
                        <Button type="submit" isLoading={loading} disabled={!selectedExamId || !score} className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white font-black uppercase text-[10px] tracking-widest rounded-xl px-8">
                            <Save className="w-4 h-4 mr-2" /> Save Mark
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
