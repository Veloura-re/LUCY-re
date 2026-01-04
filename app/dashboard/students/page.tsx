"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileDown, BookOpen, GraduationCap, Users, MessageSquare, Shield, Filter, Calendar, ChevronRight, X, Trash2, FileText } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";
import { SpringingLoader } from "@/components/dashboard/springing-loader";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { AlertModal } from "@/components/ui/confirmation-modal";
import { format } from "date-fns";
import { ImageUpload } from "@/components/ui/image-upload";
import { GradeStudentModal } from "@/components/dashboard/grade-student-modal";
import { PenTool } from "lucide-react";

export default function StudentsPage() {
    const [isAdding, setIsAdding] = useState(false);
    const [newStudent, setNewStudent] = useState({
        firstName: "", lastName: "", grade: "", classId: "", email: "",
        gender: "", dob: "", age: "", address: "", guardianName: "", guardianPhone: "", secondaryPhone: "", photoUrl: ""
    });
    const [students, setStudents] = useState<any[]>([]);
    const [grades, setGrades] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Deletion Modal
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [alertConfig, setAlertConfig] = useState<{ title: string, message: string, isOpen: boolean, variant?: "info" | "success" | "error" }>({ title: "", message: "", isOpen: false, variant: "info" });

    // Grading Modal
    const [gradingStudent, setGradingStudent] = useState<any>(null);

    const supabase = createClient();

    useEffect(() => {
        const init = async () => {
            await Promise.all([fetchStudents(), fetchGrades()]);
            setFetching(false);
        };
        init();
    }, []);

    const fetchStudents = async () => {
        try {
            const res = await fetch('/api/school/students');
            const data = await res.json();
            if (data.students) setStudents(data.students);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchGrades = async () => {
        const res = await fetch('/api/school/classes');
        const data = await res.json();
        if (data.grades) setGrades(data.grades);
    };

    const handleAddStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/school/students', {
                method: 'POST',
                body: JSON.stringify(newStudent)
            });

            if (res.ok) {
                setIsAdding(false);
                setNewStudent({
                    firstName: "", lastName: "", grade: "", classId: "", email: "",
                    gender: "", dob: "", age: "", address: "", guardianName: "", guardianPhone: "", secondaryPhone: "", photoUrl: ""
                });
                fetchStudents();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        setConfirmDeleteId(id);
    };

    const executeDelete = async () => {
        if (!confirmDeleteId) return;
        setLoading(true); // Re-using loading state
        try {
            const res = await fetch(`/api/school/students?id=${confirmDeleteId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setStudents(prev => prev.filter(s => s.id !== confirmDeleteId));
                setAlertConfig({ title: "Student Record Archived", message: "The database has successfully purged the selected entity.", isOpen: true, variant: "success" });
            } else {
                setAlertConfig({ title: "Purge Failed", message: "System locked. Unable to delete active student record.", isOpen: true, variant: "error" });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setConfirmDeleteId(null);
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(s =>
    (s.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.studentCode?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (fetching) return <div className="min-h-[60vh] flex items-center justify-center"><SpringingLoader message="Accessing Student Registry" /></div>;

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-1000 relative z-10 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-900 pb-10">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter text-white">
                        Student <span className="text-eduGreen-500 italic">Registry</span>
                    </h1>
                    <p className="text-zinc-600 font-bold uppercase tracking-[0.2em] text-xs mt-3">Active Enrollment & Records</p>
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        className="bg-zinc-900 hover:bg-zinc-800 text-white h-14 px-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] border border-zinc-800 transition-all"
                    >
                        <FileDown className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                    <Button
                        onClick={() => setIsAdding(!isAdding)}
                        className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-eduGreen-900/20 transition-all active:scale-95"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        {isAdding ? "Cancel Enrollment" : "Enrol Student"}
                    </Button>
                </div>
            </div>

            {isAdding && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <Card className="bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 rounded-[2.5rem] overflow-hidden border-t-zinc-800/20 shadow-2xl">
                        <CardHeader className="text-center pt-10 pb-6 border-b border-zinc-900/50">
                            <CardTitle className="text-xl font-black text-white tracking-tight">New Student Enrollment</CardTitle>
                            <CardDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mt-2">Create new academic entity record</CardDescription>
                        </CardHeader>
                        <CardContent className="p-10">
                            <form onSubmit={handleAddStudent} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="md:col-span-2 space-y-4">
                                    <label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-2">Student Identity</label>
                                    <div className="p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800/50">
                                        <ImageUpload
                                            value={newStudent.photoUrl}
                                            onChange={(url) => setNewStudent({ ...newStudent, photoUrl: url })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-2">Personal Details</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            placeholder="First Name"
                                            value={newStudent.firstName}
                                            onChange={e => setNewStudent({ ...newStudent, firstName: e.target.value })}
                                            required
                                            className="bg-zinc-900/30 border-zinc-800 text-white h-14 rounded-2xl focus:border-eduGreen-600 transition-all border-2"
                                        />
                                        <Input
                                            placeholder="Last Name"
                                            value={newStudent.lastName}
                                            onChange={e => setNewStudent({ ...newStudent, lastName: e.target.value })}
                                            required
                                            className="bg-zinc-900/30 border-zinc-800 text-white h-14 rounded-2xl focus:border-eduGreen-600 transition-all border-2"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Select onValueChange={(v: string) => setNewStudent({ ...newStudent, gender: v })}>
                                            <SelectTrigger className="h-14 rounded-2xl bg-zinc-900/30 border-zinc-800 border-2 text-zinc-300">
                                                <SelectValue placeholder="Gender" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                                                <SelectItem value="MALE">Male</SelectItem>
                                                <SelectItem value="FEMALE">Female</SelectItem>
                                                <SelectItem value="OTHER">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest ml-1">DOB</label>
                                                <Input
                                                    type="date"
                                                    value={newStudent.dob}
                                                    onChange={e => setNewStudent({ ...newStudent, dob: e.target.value, age: "" })}
                                                    className="bg-zinc-900/30 border-zinc-800 text-white h-10 rounded-xl focus:border-eduGreen-600 transition-all border-2 w-full text-xs"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest ml-1">Age</label>
                                                <Input
                                                    type="number"
                                                    placeholder="Age"
                                                    value={newStudent.age}
                                                    onChange={e => {
                                                        const age = e.target.value;
                                                        const dob = age ? format(new Date(new Date().getFullYear() - parseInt(age), 0, 1), 'yyyy-MM-dd') : "";
                                                        setNewStudent({ ...newStudent, age, dob });
                                                    }}
                                                    className="bg-zinc-900/30 border-zinc-800 text-white h-10 rounded-xl focus:border-eduGreen-600 transition-all border-2 w-full text-xs"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <Input
                                        placeholder="Home Address"
                                        value={newStudent.address}
                                        onChange={e => setNewStudent({ ...newStudent, address: e.target.value })}
                                        className="bg-zinc-900/30 border-zinc-800 text-white h-14 rounded-2xl focus:border-eduGreen-600 transition-all border-2"
                                    />
                                    <Input
                                        placeholder="Email (Optional)"
                                        type="email"
                                        value={newStudent.email}
                                        onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
                                        className="bg-zinc-900/30 border-zinc-800 text-white h-14 rounded-2xl focus:border-eduGreen-600 transition-all border-2"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-2">Academic & Guardian</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Select onValueChange={(v: string) => {
                                            const grade = grades.find(g => g.id === v);
                                            // Handle Grade selection - if grade has classes, maybe auto-select first or show classes?
                                            // For simplicity, we assign Grade here. If filtering classes is needed, we need state for selectedGrade.
                                            setNewStudent({ ...newStudent, grade: v, classId: "" })
                                        }}>
                                            <SelectTrigger className="h-14 rounded-2xl bg-zinc-900/30 border-zinc-800 border-2 text-zinc-300">
                                                <SelectValue placeholder="Select Grade" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-950 border-zinc-800 text-white max-h-[300px]">
                                                {grades.map(g => (
                                                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Select onValueChange={(v: string) => setNewStudent({ ...newStudent, classId: v })} disabled={!newStudent.grade}>
                                            <SelectTrigger className="h-14 rounded-2xl bg-zinc-900/30 border-zinc-800 border-2 text-zinc-300">
                                                <SelectValue placeholder="Select Class" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-950 border-zinc-800 text-white max-h-[300px]">
                                                {grades.find(g => g.id === newStudent.grade)?.classes.map((c: any) => (
                                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Input
                                        placeholder="Guardian Name"
                                        value={newStudent.guardianName}
                                        onChange={e => setNewStudent({ ...newStudent, guardianName: e.target.value })}
                                        className="bg-zinc-900/30 border-zinc-800 text-white h-14 rounded-2xl focus:border-eduGreen-600 transition-all border-2"
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            placeholder="Guardian Phone"
                                            value={newStudent.guardianPhone}
                                            onChange={e => setNewStudent({ ...newStudent, guardianPhone: e.target.value })}
                                            className="bg-zinc-900/30 border-zinc-800 text-white h-14 rounded-2xl focus:border-eduGreen-600 transition-all border-2"
                                        />
                                        <Input
                                            placeholder="Secondary Phone"
                                            value={newStudent.secondaryPhone}
                                            onChange={e => setNewStudent({ ...newStudent, secondaryPhone: e.target.value })}
                                            className="bg-zinc-900/30 border-zinc-800 text-white h-14 rounded-2xl focus:border-eduGreen-600 transition-all border-2"
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2 pt-4 border-t border-zinc-900/50 flex justify-end">
                                    <Button type="submit" isLoading={loading} className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white h-14 px-10 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-eduGreen-900/20">
                                        Confirm Enrollment
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStudents.map((student) => (
                    <div key={student.id} className="group relative">
                        <Link href={`/dashboard/students/${student.id}`}>
                            <Card className="bg-zinc-950 border-zinc-950 hover:bg-zinc-900/30 transition-all cursor-pointer h-full rounded-[2rem] overflow-hidden group/card shadow-none hover:shadow-2xl hover:shadow-black/50">
                                <CardHeader className="p-8 pb-4 flex flex-row items-start justify-between border-b border-zinc-900/30">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-16 rounded-lg bg-zinc-900/50 border border-zinc-900/50 flex items-center justify-center text-xl font-black text-zinc-900 shadow-inner overflow-hidden">
                                            {student.photoUrl ? (
                                                <img src={student.photoUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                `${student.firstName[0]}${student.lastName[0]}`
                                            )}
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-black text-white leading-none group-hover:text-eduGreen-400 transition-colors">
                                                {student.firstName} {student.lastName}
                                            </CardTitle>
                                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-2">{student.studentCode}</p>
                                        </div>
                                    </div>
                                    <div className={`w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ${student.enrollmentStatus === 'ACTIVE' ? 'bg-eduGreen-500' : 'bg-zinc-800'}`} />
                                </CardHeader>
                                <CardContent className="p-8 pt-2">
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        <div className="px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50 text-[9px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                            <GraduationCap className="w-3 h-3" />
                                            {student.grade?.name}
                                        </div>
                                        <div className="px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50 text-[9px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                            <BookOpen className="w-3 h-3" />
                                            {student.class?.name || "Unassigned"}
                                        </div>
                                        {student.user && (
                                            <div className="px-3 py-1.5 rounded-lg bg-eduGreen-950/10 border border-eduGreen-900/20 text-[9px] font-bold text-eduGreen-600 uppercase tracking-wider flex items-center gap-2">
                                                <Shield className="w-3 h-3" />
                                                Portal Active
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-8 flex items-center justify-between border-t border-zinc-900/50 pt-4">
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleDelete(student.id);
                                                }}
                                                className="h-8 w-8 p-0 rounded-full hover:bg-rose-500/10 text-zinc-600 hover:text-rose-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                            <Link href={`/dashboard/students/${student.id}`}>
                                                <Button
                                                    variant="ghost"
                                                    className="h-8 px-3 rounded-lg hover:bg-zinc-900 text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors"
                                                >
                                                    View Dossier <ChevronRight className="w-3 h-3 ml-1" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setGradingStudent(student);
                                                }}
                                                className="h-8 px-3 rounded-lg hover:bg-zinc-900 text-[9px] font-black uppercase tracking-widest text-eduGreen-600 hover:text-eduGreen-500 transition-colors"
                                            >
                                                <PenTool className="w-3 h-3 mr-2" /> Add Mark
                                            </Button>
                                            <Link href={`/dashboard/students/${student.id}?tab=academic`}>
                                                <Button
                                                    variant="ghost"
                                                    className="h-8 px-3 rounded-lg hover:bg-zinc-900 text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                                                >
                                                    <FileText className="w-3 h-3 mr-2" /> Marklist
                                                </Button>
                                            </Link>
                                        </div>
                                        {student.user && (
                                            <Link href={`/dashboard/messages?userId=${student.user.id}`} onClick={(e) => e.stopPropagation()}>
                                                <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-eduGreen-600 hover:text-white transition-all text-zinc-600">
                                                    <MessageSquare className="w-3 h-3" />
                                                </div>
                                            </Link>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>
                ))}
            </div>

            <ConfirmationModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={executeDelete}
                title="Archive Student Record"
                description="This action will permanentely deactivate the student's academic profile. Historical grade data will be retained in cold storage."
                confirmText="Archive Record"
                variant="danger"
            />

            <AlertModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
                variant={alertConfig.variant}
            />

            <GradeStudentModal
                isOpen={!!gradingStudent}
                onClose={() => setGradingStudent(null)}
                student={gradingStudent}
            />
        </div>
    );
}
