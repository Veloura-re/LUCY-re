"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    GraduationCap, BookOpen, Clock, FileText,
    ArrowLeft, TrendingUp, ShieldAlert, MessageSquare,
    Save, Plus, Trash2, Calendar, CreditCard
} from "lucide-react";
import { SpringingLoader } from "@/components/dashboard/springing-loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, calculateAge } from "@/lib/utils";
import { format } from "date-fns";
import { IDCardModal } from "@/components/dashboard/id-card-modal";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function StudentProfilePage() {
    const formatDate = (dateString: any, fmt: string) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "N/A";
            return format(date, fmt);
        } catch (error) {
            return "N/A";
        }
    };

    const { studentId } = useParams();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("academic");
    const [remarks, setRemarks] = useState<any[]>([]);
    const [notes, setNotes] = useState<any[]>([]);
    const [newRemark, setNewRemark] = useState("");
    const [newNote, setNewNote] = useState("");
    const [isAddingRemark, setIsAddingRemark] = useState(false);
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showIDCard, setShowIDCard] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<any>({});
    const [gradesData, setGradesData] = useState<any[]>([]); // For class selection
    const searchParams = useSearchParams();

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) setActiveTab(tab);
        fetchStudentData();
    }, [studentId, searchParams]);

    const fetchStudentData = async () => {
        try {
            const res = await fetch(`/api/school/students/${studentId}/report-card`);
            const d = await res.json();
            setData(d);
            setData(d);
            setRemarks(d.remarks || []);
            setNotes(d.internalNotes || []);

            // Pre-fill edit form
            if (d.student) {
                setEditForm({
                    firstName: d.student.firstName,
                    lastName: d.student.lastName,
                    email: d.student.email || "",
                    guardianName: d.student.guardianName || "",
                    guardianPhone: d.student.guardianPhone || "",
                    secondaryPhone: d.student.secondaryPhone || "",
                    photoUrl: d.student.photoUrl || "",
                    address: d.student.address || "",
                    dob: d.student.dob && !isNaN(new Date(d.student.dob).getTime()) ? format(new Date(d.student.dob), 'yyyy-MM-dd') : "",
                    age: d.student.dob && !isNaN(new Date(d.student.dob).getTime()) ? calculateAge(d.student.dob) : "",
                    gender: d.student.gender || "MALE",
                    studentCode: d.student.studentCode
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Fetch grades for class selection if editing
    const fetchGradesData = async () => {
        const res = await fetch('/api/school/classes');
        const d = await res.json();
        if (d.grades) setGradesData(d.grades);
    };

    const handleUpdateStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/school/students', {
                method: 'PUT',
                body: JSON.stringify({ id: studentId, ...editForm })
            });

            if (res.ok) {
                toast.success("Student Dossier Synchronized");
                setIsEditing(false);
                fetchStudentData();
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || "Uplink Failure: Mutation Rejected");
            }
        } catch (err) {
            console.error(err);
            toast.error("Neural Link Failure: Request Timed Out");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddRemark = async () => {
        if (!newRemark.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetch(`/api/school/students/${studentId}/remarks`, {
                method: 'POST',
                body: JSON.stringify({ content: newRemark, term: "CURRENT" })
            });
            if (res.ok) {
                setNewRemark("");
                setIsAddingRemark(false);
                fetchStudentData();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetch(`/api/school/students/${studentId}/notes`, {
                method: 'POST',
                body: JSON.stringify({ content: newNote })
            });
            if (res.ok) {
                setNewNote("");
                setIsAddingNote(false);
                fetchStudentData();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><SpringingLoader message="Synthesizing Student Dossier" /></div>;
    if (!data?.student) return <div className="p-20 text-center text-zinc-500 font-bold uppercase tracking-widest">Neural Link Severed: Entity Not Found</div>;

    const { student, grades, attendance } = data;

    const getPerformanceColor = (pct: number) => {
        if (pct >= 80) return { text: "text-emerald-500", border: "border-emerald-900/30", bg: "bg-emerald-900/10" };
        if (pct >= 60) return { text: "text-blue-500", border: "border-blue-900/30", bg: "bg-blue-900/10" };
        if (pct >= 40) return { text: "text-amber-500", border: "border-amber-900/30", bg: "bg-amber-900/10" };
        return { text: "text-rose-500", border: "border-rose-900/30", bg: "bg-rose-900/10" };
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            {/* Header / Navigation */}
            <div className="flex items-center justify-between">
                <Button
                    onClick={() => router.back()}
                    variant="ghost"
                    className="text-zinc-600 hover:text-white font-black uppercase tracking-widest text-[10px] gap-2"
                >
                    <ArrowLeft className="w-4 h-4" /> Return to Registry
                </Button>
                <div className="flex gap-4">
                    <Button className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest h-12 px-6">
                        Export Full Dossier
                    </Button>
                    <Button
                        onClick={() => { setIsEditing(true); fetchGradesData(); }}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest h-12 px-6"
                    >
                        Edit Profile
                    </Button>
                    <Button
                        onClick={() => setShowIDCard(true)}
                        className="bg-zinc-100 hover:bg-white text-zinc-900 rounded-xl font-black uppercase text-[10px] tracking-widest h-12 px-6"
                    >
                        <CreditCard className="w-4 h-4 mr-2" /> Generate ID
                    </Button>
                </div>
            </div>

            <IDCardModal
                isOpen={showIDCard}
                onClose={() => setShowIDCard(false)}
                user={student}
                type="STUDENT"
                schoolName={student.school?.name}
                schoolAddress={student.school?.address}
            />

            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="bg-zinc-950 border-zinc-900 text-white max-w-2xl rounded-[2.5rem]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black italic">Edit Student Profile</DialogTitle>
                        <DialogDescription className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Update registry information</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateStudent} className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <div className="md:col-span-2 flex justify-center py-4 bg-zinc-900/30 rounded-2xl">
                            <ImageUpload value={editForm.photoUrl} onChange={(url) => setEditForm({ ...editForm, photoUrl: url })} bucket="avatars" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">First Name</label>
                            <Input value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} className="bg-zinc-900 border-zinc-800 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Last Name</label>
                            <Input value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} className="bg-zinc-900 border-zinc-800 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Email</label>
                            <Input value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="bg-zinc-900 border-zinc-800 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Date of Birth</label>
                            <Input type="date" value={editForm.dob} onChange={e => setEditForm({ ...editForm, dob: e.target.value })} className="bg-zinc-900 border-zinc-800 rounded-xl" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Guardian Name</label>
                            <Input value={editForm.guardianName} onChange={e => setEditForm({ ...editForm, guardianName: e.target.value })} className="bg-zinc-900 border-zinc-800 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Guardian Phone</label>
                            <Input value={editForm.guardianPhone} onChange={e => setEditForm({ ...editForm, guardianPhone: e.target.value })} className="bg-zinc-900 border-zinc-800 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Secondary Phone (Optional)</label>
                            <Input value={editForm.secondaryPhone} onChange={e => setEditForm({ ...editForm, secondaryPhone: e.target.value })} className="bg-zinc-900 border-zinc-800 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Edit Age (Auto-calculates DOB)</label>
                            <Input
                                type="number"
                                value={editForm.age}
                                onChange={e => {
                                    const age = e.target.value;
                                    const dob = format(new Date(new Date().getFullYear() - parseInt(age || "0"), 0, 1), 'yyyy-MM-dd');
                                    setEditForm({ ...editForm, age, dob });
                                }}
                                placeholder="Enter Age"
                                className="bg-zinc-900 border-zinc-800 rounded-xl"
                            />
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} className="text-zinc-500 hover:text-white font-black uppercase text-[10px] tracking-widest">Cancel</Button>
                            <Button type="submit" isLoading={submitting} className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white font-black uppercase text-[10px] tracking-widest rounded-xl px-8">Save Changes</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Profile Info Card */}
            <Card className="bg-zinc-950/40 backdrop-blur-2xl border-zinc-900 rounded-[3rem] overflow-hidden border-t-zinc-800/20">
                <div className="p-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-zinc-900 border-2 border-eduGreen-900/30 flex items-center justify-center text-4xl font-black text-eduGreen-500 shadow-2xl relative overflow-hidden">
                            {student.firstName[0]}{student.lastName[0]}
                            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-eduGreen-500 shadow-[0_0_15px_rgba(59,214,141,0.5)]" />
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                            <h1 className="text-4xl font-black text-white tracking-tight italic">
                                {student.firstName} <span className="text-zinc-700 not-italic ml-2">{student.lastName}</span>
                            </h1>
                            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-eduGreen-950/20 border border-eduGreen-900/30 text-[10px] font-black text-eduGreen-500 uppercase tracking-[0.2em] shadow-lg shadow-eduGreen-950/10">
                                Active Learner
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-6 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-eduGreen-700" />
                                <span>{student.class?.grade?.name || "No Grade"} / {student.class?.name || "Unassigned"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 text-amber-700" />
                                <span>ID: {student.studentCode}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-700" />
                                <span>Enrolled: {formatDate(student.createdAt, 'MMM yyyy')} • {calculateAge(student.dob)}Y</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-zinc-900/40 rounded-3xl border border-zinc-800/80 text-center">
                            <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Attendance</div>
                            <div className="text-2xl font-black text-white italic">
                                {attendance.total > 0 ? Math.round((attendance.present / attendance.total) * 100) : 0}%
                            </div>
                        </div>

                    </div>
                </div>
            </Card>

            <Tabs defaultValue="academic" className="space-y-8" onValueChange={setActiveTab}>
                <TabsList className="bg-zinc-950/50 border border-zinc-900 p-1.5 rounded-2xl h-16">
                    <TabsTrigger value="academic" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-eduGreen-600 data-[state=active]:text-white">Academic DNA</TabsTrigger>
                    <TabsTrigger value="attendance" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-eduGreen-600 data-[state=active]:text-white">Biometric Log</TabsTrigger>
                    <TabsTrigger value="remarks" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-eduGreen-600 data-[state=active]:text-white">Institutional Remarks</TabsTrigger>
                    <TabsTrigger value="notes" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-eduGreen-600 data-[state=active]:text-white">Faculty Notes (Secure)</TabsTrigger>
                </TabsList>

                {/* --- Academic Section --- */}
                <TabsContent value="academic" className="animate-in slide-in-from-bottom-4 duration-500">
                    <div className="grid lg:grid-cols-12 gap-8">
                        <Card className="lg:col-span-8 bg-zinc-900/30 backdrop-blur-md border-zinc-900 rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="p-8 border-b border-zinc-800/50 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl font-black text-white italic">Execution <span className="text-zinc-700 not-italic ml-1">Matrix</span></CardTitle>
                                    <CardDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mt-1">Validated academic grade records</CardDescription>
                                </div>
                                <div className="hidden md:flex gap-1.5 h-6">
                                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-1 bg-eduGreen-500/20 rounded-full" style={{ height: `${20 + i * 15}%` }} />)}
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 pb-4">
                                {/* Grade Trend SVG Chart */}
                                {grades.length > 1 && (
                                    <div className="mb-10 p-6 bg-zinc-950/50 rounded-3xl border border-zinc-800/50 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-eduGreen-500/5 to-transparent opacity-50" />
                                        <div className="flex items-center gap-2 mb-6">
                                            <TrendingUp className="w-3.5 h-3.5 text-eduGreen-500" />
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Efficiency Progression</span>
                                        </div>
                                        <div className="h-32 w-full relative">
                                            <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 100" preserveAspectRatio="none">
                                                <defs>
                                                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#3BD68D" stopOpacity="0.4" />
                                                        <stop offset="100%" stopColor="#3BD68D" stopOpacity="0" />
                                                    </linearGradient>
                                                </defs>
                                                {/* Area under curve */}
                                                <path
                                                    d={`M 0 100 ${grades.map((g: any, i: number) => `L ${(i / (grades.length - 1)) * 1000} ${100 - (g.score / 100) * 100}`).join(' ')} L 1000 100 Z`}
                                                    fill="url(#lineGrad)"
                                                    className="transition-all duration-1000"
                                                />
                                                {/* Line */}
                                                <path
                                                    d={grades.map((g: any, i: number) => `${i === 0 ? 'M' : 'L'} ${(i / (grades.length - 1)) * 1000} ${100 - (g.score / 100) * 100}`).join(' ')}
                                                    fill="none"
                                                    stroke="#3BD68D"
                                                    strokeWidth="4"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="drop-shadow-[0_0_8px_rgba(59,214,141,0.5)]"
                                                />
                                                {/* Data Points */}
                                                {grades.map((g: any, i: number) => (
                                                    <circle
                                                        key={i}
                                                        cx={(i / (grades.length - 1)) * 1000}
                                                        cy={100 - (g.score / 100) * 100}
                                                        r="6"
                                                        fill="#000"
                                                        stroke="#3BD68D"
                                                        strokeWidth="3"
                                                        className="hover:r-8 hover:fill-eduGreen-500 transition-all cursor-pointer"
                                                    />
                                                ))}
                                            </svg>
                                        </div>
                                    </div>
                                )}

                                <div className="divide-y divide-zinc-950 border-t border-zinc-900/50 -mx-8">
                                    {grades.length === 0 ? (
                                        <div className="p-20 text-center opacity-40">
                                            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-zinc-800" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">No validated records discovered</p>
                                        </div>
                                    ) : (
                                        grades.map((grade: any, i: number) => (
                                            <div key={i} className="p-8 flex items-center justify-between hover:bg-eduGreen-900/5 transition-all group">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center justify-center group-hover:border-eduGreen-900/30 transition-colors">
                                                        <BookOpen className="w-5 h-5 text-zinc-800 group-hover:text-eduGreen-500 transition-colors" />
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-white tracking-tight uppercase text-sm">{grade.subject?.name}</div>
                                                        <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">{grade.exam?.title || "Class Assessment"}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-8">
                                                    <div className="text-right">
                                                        <div className="text-[10px] font-black text-zinc-700 uppercase tracking-widest mb-1">{formatDate(grade.createdAt, 'MMM dd')}</div>
                                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-950 rounded-lg border border-zinc-900 text-[9px] font-black uppercase text-zinc-500">
                                                            {grade.status}
                                                        </div>
                                                    </div>
                                                    <div className={cn(
                                                        "w-16 h-16 rounded-2xl bg-zinc-950 border flex flex-col items-center justify-center font-black italic shadow-inner",
                                                        grade.exam?.totalMarks ? getPerformanceColor((parseFloat(grade.score) / grade.exam.totalMarks) * 100).border : "border-zinc-900"
                                                    )}>
                                                        <span className={cn(
                                                            "text-xl",
                                                            grade.exam?.totalMarks ? getPerformanceColor((parseFloat(grade.score) / grade.exam.totalMarks) * 100).text : "text-eduGreen-500"
                                                        )}>{grade.score}</span>
                                                        {grade.exam?.totalMarks && <span className="text-[9px] text-zinc-600 not-italic">/ {grade.exam.totalMarks}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="lg:col-span-4 space-y-8">
                            <Card className="bg-zinc-900/30 border-zinc-900 rounded-[2.5rem] p-8">
                                <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-6">Subject Variance</h4>
                                <div className="space-y-6">
                                    {Array.from(new Set(grades.map((g: any) => g.subject?.name))).slice(0, 4).map((sub: any, i) => (
                                        <div key={i} className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-black uppercase">
                                                <span className="text-zinc-400">{sub}</span>
                                                <span className="text-white">88%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                                                <div className="h-full bg-eduGreen-600 rounded-full shadow-[0_0_8px_rgba(33,201,141,0.5)]" style={{ width: '88%' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* --- Attendance Section --- */}
                <TabsContent value="attendance" className="animate-in slide-in-from-bottom-4 duration-500">
                    <div className="grid lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-1 space-y-4">
                            <Card className="p-8 bg-zinc-950/50 border-zinc-900 rounded-[2.5rem] text-center">
                                <Clock className="w-8 h-8 text-eduGreen-500 mx-auto mb-4" />
                                <div className="text-4xl font-black text-white italic">{attendance.present}</div>
                                <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mt-1">Days Present</div>
                            </Card>
                            <Card className="p-8 bg-zinc-950/50 border-zinc-900 rounded-[2.5rem] text-center">
                                <ShieldAlert className="w-8 h-8 text-red-500 mx-auto mb-4" />
                                <div className="text-4xl font-black text-white italic">{attendance.absent}</div>
                                <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mt-1">Unexcused Absence</div>
                            </Card>
                        </div>
                        <Card className="lg:col-span-3 bg-zinc-900/30 backdrop-blur-md border-zinc-900 rounded-[2.5rem]">
                            <CardHeader className="p-8 border-b border-zinc-800/50">
                                <CardTitle className="text-xl font-black text-white italic">Temporal <span className="text-zinc-700 not-italic ml-1">Flow</span></CardTitle>
                                <CardDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mt-1">Historical attendance records</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="p-20 text-center opacity-30">
                                    <p className="text-[10px] font-black uppercase tracking-widest">Attendance Heatmap Syncing...</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- Remarks Section --- */}
                <TabsContent value="remarks" className="animate-in slide-in-from-bottom-4 duration-500">
                    <Card className="bg-zinc-900/30 backdrop-blur-md border-zinc-900 rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-8 border-b border-zinc-800/50 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-black text-white tracking-tight">Institutional Narrative</CardTitle>
                                <CardDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mt-1">Formal term observations for parents & students</CardDescription>
                            </div>
                            <Button
                                onClick={() => setIsAddingRemark(!isAddingRemark)}
                                className="bg-eduGreen-600/10 hover:bg-eduGreen-600/20 text-eduGreen-500 border border-eduGreen-900/30 rounded-xl h-10 font-black uppercase text-[9px] tracking-widest"
                            >
                                <Plus className="w-3 h-3 mr-2" /> {isAddingRemark ? "Cancel" : "New Remark"}
                            </Button>
                        </CardHeader>
                        <CardContent className="p-8">
                            {isAddingRemark && (
                                <div className="mb-8 p-6 bg-zinc-950/40 border border-zinc-900 rounded-3xl animate-in slide-in-from-top-4 duration-300">
                                    <textarea
                                        value={newRemark}
                                        onChange={(e) => setNewRemark(e.target.value)}
                                        placeholder="Enter formal academic or behavioral observation..."
                                        className="w-full bg-zinc-900/50 border-zinc-800 rounded-2xl p-4 text-sm font-bold text-white focus:border-eduGreen-600 outline-none transition-all min-h-[120px]"
                                    />
                                    <div className="flex justify-end mt-4">
                                        <Button
                                            onClick={handleAddRemark}
                                            disabled={submitting || !newRemark.trim()}
                                            className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white rounded-xl h-10 px-6 font-black uppercase text-[9px] tracking-[0.2em]"
                                        >
                                            {submitting ? "Encrypting..." : "Publish Remark"}
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-6">
                                {remarks.length === 0 ? (
                                    <div className="py-20 text-center opacity-30">
                                        <FileText className="w-10 h-10 mx-auto mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No formal observations registered</p>
                                    </div>
                                ) : (
                                    remarks.map((r, i) => (
                                        <div key={i} className="p-8 bg-zinc-950/40 border border-zinc-900/50 rounded-3xl relative">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 border border-zinc-800">
                                                        <AvatarFallback className="text-[9px] font-black bg-zinc-900 text-zinc-500">{(r.teacher?.name && r.teacher.name[0]) || 'T'}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="text-[10px] font-black text-zinc-100 uppercase tracking-tight">{r.teacher?.name}</div>
                                                        <div className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">Authorized Faculty</div>
                                                    </div>
                                                </div>
                                                <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">{formatDate(r.createdAt, 'MMM yyyy')}</div>
                                            </div>
                                            <p className="text-sm font-bold text-zinc-400 leading-relaxed italic pr-12">"{r.content}"</p>
                                            <div className="absolute bottom-6 right-8 text-[8px] font-black text-eduGreen-600/50 uppercase tracking-[0.2em]">Validated Node</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- Notes Section --- */}
                <TabsContent value="notes" className="animate-in slide-in-from-bottom-4 duration-500">
                    <Card className="bg-eduGreen-950/5 border-eduGreen-900/20 rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-8 border-b border-eduGreen-900/10 flex flex-row items-center justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <ShieldAlert className="w-4 h-4 text-eduGreen-500" />
                                    <span className="text-[10px] font-black text-eduGreen-500 uppercase tracking-[0.3em]">Confidential Protocol</span>
                                </div>
                                <CardTitle className="text-xl font-black text-white">Faculty Internal Data</CardTitle>
                                <CardDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mt-1">Privileged observations NOT visible to parents or students</CardDescription>
                            </div>
                            <Button
                                onClick={() => setIsAddingNote(!isAddingNote)}
                                className="bg-eduGreen-600/10 hover:bg-eduGreen-600/20 text-eduGreen-500 border border-eduGreen-900/30 rounded-xl h-10 font-black uppercase text-[9px] tracking-widest"
                            >
                                <Plus className="w-3 h-3 mr-2" /> {isAddingNote ? "Cancel" : "Log internal Incident"}
                            </Button>
                        </CardHeader>
                        <CardContent className="p-8">
                            {isAddingNote && (
                                <div className="mb-8 p-6 bg-zinc-950/10 border border-eduGreen-900/20 rounded-3xl animate-in slide-in-from-top-4 duration-300">
                                    <textarea
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        placeholder="Record confidential disciplinary or behavioral data..."
                                        className="w-full bg-zinc-900/50 border-zinc-800 rounded-2xl p-4 text-sm font-bold text-white focus:border-eduGreen-600 outline-none transition-all min-h-[120px]"
                                    />
                                    <div className="flex justify-end mt-4">
                                        <Button
                                            onClick={handleAddNote}
                                            disabled={submitting || !newNote.trim()}
                                            className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white rounded-xl h-10 px-6 font-black uppercase text-[9px] tracking-[0.2em]"
                                        >
                                            {submitting ? "Securing..." : "Commit to Secure Node"}
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-6">
                                {(!data.internalNotes || data.internalNotes.length === 0) ? (
                                    <div className="py-20 text-center opacity-40">
                                        <MessageSquare className="w-10 h-10 mx-auto mb-4 text-eduGreen-900" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-eduGreen-900/50">Registry is clear of disciplinary incidents</p>
                                    </div>
                                ) : (
                                    data.internalNotes.map((n: any, i: number) => (
                                        <div key={i} className="p-8 bg-zinc-950/40 border border-zinc-900/50 rounded-3xl relative">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 border border-zinc-800">
                                                        <AvatarFallback className="text-[9px] font-black bg-zinc-900 text-eduGreen-500">{(n.author?.name && n.author.name[0]) || 'A'}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="text-[10px] font-black text-zinc-100 uppercase tracking-tight">{n.author?.name}</div>
                                                        <div className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">Reporting Official</div>
                                                    </div>
                                                </div>
                                                <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">{formatDate(n.createdAt, 'MMM dd, HH:mm')}</div>
                                            </div>
                                            <p className="text-sm font-bold text-zinc-400 leading-relaxed italic pr-12">{n.content}</p>
                                            <div className="absolute top-8 right-8 text-eduGreen-500/20">
                                                <ShieldAlert className="w-6 h-6" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
