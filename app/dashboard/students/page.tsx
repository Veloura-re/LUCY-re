"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileDown, BookOpen, GraduationCap, Users, MessageSquare, Shield } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";
import { SpringingLoader } from "@/components/dashboard/springing-loader";
import { AlertModal } from "@/components/ui/confirmation-modal";

export default function StudentsPage() {
    const [isAdding, setIsAdding] = useState(false);
    const [newStudent, setNewStudent] = useState({ firstName: "", lastName: "", grade: "", classId: "", email: "" });
    const [students, setStudents] = useState<any[]>([]);
    const [grades, setGrades] = useState<any[]>([]);
    const [filteredClasses, setFilteredClasses] = useState<any[]>([]);
    const [me, setMe] = useState<any>(null);
    const [fetching, setFetching] = useState(true);
    const [showAlert, setShowAlert] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setMe(user);
            await Promise.all([fetchStudents(), fetchGrades()]);
            setFetching(false);
        };
        init();
    }, []);

    // Filter classes when grade selection changes
    useEffect(() => {
        if (newStudent.grade && grades.length) {
            // Find grade record matching the level entered/selected
            const gradeRec = grades.find(g => g.level === parseInt(newStudent.grade));
            if (gradeRec) {
                setFilteredClasses(gradeRec.classes);
            } else {
                setFilteredClasses([]);
            }
        } else {
            setFilteredClasses([]);
        }
    }, [newStudent.grade, grades]);

    const fetchStudents = async () => {
        const res = await fetch('/api/school/students');
        const data = await res.json();
        if (data.students) setStudents(data.students);
    };

    const fetchGrades = async () => {
        const res = await fetch('/api/school/classes');
        const data = await res.json();
        if (data.grades) setGrades(data.grades);
    };

    const [loading, setLoading] = useState(false);

    const handleAddStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/school/students', {
                method: 'POST',
                body: JSON.stringify(newStudent)
            });
            if (res.ok) {
                setShowAlert(true);
                setIsAdding(false);
                setNewStudent({ firstName: "", lastName: "", grade: "", classId: "", email: "" });
                fetchStudents();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <SpringingLoader message="Retrieving Academic Personnel Registry" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-1000 relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-900 pb-10">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter text-white">
                        Academic <span className="text-eduGreen-500 italic">Registry</span>
                    </h1>
                    <p className="text-zinc-600 font-bold uppercase tracking-[0.2em] text-xs mt-3">Institutional Student Body & Enrollment</p>
                </div>

                <div className="flex items-center gap-3 mb-1">
                    <Button variant="outline" className="rounded-2xl border-zinc-900 bg-zinc-950/50 hover:border-zinc-700 transition-all h-14 px-6 font-bold text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white">
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
                        <CardHeader className="pt-10 pb-6 px-10 border-b border-zinc-900/50">
                            <CardTitle className="text-xl font-black text-white tracking-tight">Enrollment Console</CardTitle>
                            <CardDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mt-1">Add new student to institutional registry</CardDescription>
                        </CardHeader>
                        <CardContent className="p-10">
                            <form onSubmit={handleAddStudent} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-2">Personal Credentials</label>
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
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-2">Deployment Placement</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Select onValueChange={(val: string) => setNewStudent({ ...newStudent, grade: val })}>
                                            <SelectTrigger className="h-14 rounded-2xl bg-zinc-900/30 border-zinc-800 border-2 text-zinc-300 focus:border-eduGreen-600 transition-all">
                                                <SelectValue placeholder="Grade Level" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                                                {grades.map(g => (
                                                    <SelectItem key={g.id} value={g.level.toString()} className="focus:bg-eduGreen-900/20 focus:text-eduGreen-400 font-bold text-xs">{g.name} (Lvl {g.level})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Select
                                            disabled={!filteredClasses.length}
                                            onValueChange={(val: string) => setNewStudent({ ...newStudent, classId: val })}
                                        >
                                            <SelectTrigger className="h-14 rounded-2xl bg-zinc-900/30 border-zinc-800 border-2 text-zinc-300 focus:border-eduGreen-600 transition-all disabled:opacity-30 disabled:grayscale">
                                                <SelectValue placeholder="Assigned Class" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                                                {filteredClasses.map(c => (
                                                    <SelectItem key={c.id} value={c.id} className="focus:bg-eduGreen-900/20 focus:text-eduGreen-400 font-bold text-xs">{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="md:col-span-2 space-y-4">
                                    <label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-2">Digital Communication (Optional)</label>
                                    <Input
                                        placeholder="institutional@recipient.edu"
                                        type="email"
                                        value={newStudent.email}
                                        onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
                                        className="bg-zinc-900/30 border-zinc-800 text-white h-14 rounded-2xl focus:border-eduGreen-600 transition-all border-2"
                                    />
                                </div>

                                <div className="md:col-span-2 flex justify-end gap-3 pt-8 border-t border-zinc-900">
                                    <Button variant="ghost" type="button" disabled={loading} onClick={() => setIsAdding(false)} className="text-zinc-600 hover:text-white font-black uppercase tracking-[0.2em] text-[10px] h-14 px-8">Discard</Button>
                                    <Button type="submit" isLoading={loading} className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white h-14 px-10 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-eduGreen-900/20">Confirm Deployment</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Card className="bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 rounded-[2.5rem] overflow-hidden border-t-zinc-800/20 shadow-2xl">
                <CardHeader className="p-10 border-b border-zinc-900/80 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <CardTitle className="text-2xl font-black text-white tracking-tight leading-tight">Student Directory</CardTitle>
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mt-1">Registered Institutional Learners</p>
                    </div>
                    <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900 shadow-2xl w-full md:w-80">
                        <div className="relative w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-700" />
                            <Input
                                placeholder="System query..."
                                className="pl-12 w-full bg-transparent border-0 text-white placeholder:text-zinc-800 h-11 transition-all font-bold text-sm tracking-tight focus-visible:ring-0"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-zinc-900/80">
                        {students.length === 0 ? (
                            <div className="p-20 text-center flex flex-col items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-zinc-950 border border-zinc-900 flex items-center justify-center opacity-20">
                                    <Users className="w-8 h-8 text-white" />
                                </div>
                                <p className="text-zinc-700 font-black uppercase tracking-[0.3em] text-[10px]">Registry is empty</p>
                            </div>
                        ) : (
                            students.map((student, idx) => (
                                <div key={idx} className="p-6 flex items-center justify-between hover:bg-eduGreen-900/5 transition-all group">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-center justify-center font-black text-zinc-600 uppercase group-hover:border-eduGreen-900/30 transition-colors shadow-2xl text-lg relative overflow-hidden">
                                            {student.firstName[0]}
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div>
                                            <p className="font-black text-zinc-100 group-hover:text-white transition-colors tracking-tight text-lg">{student.firstName} {student.lastName}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest font-mono opacity-80">{student.studentCode}</p>
                                                <div className="w-1 h-1 rounded-full bg-zinc-800" />
                                                <span className="text-[9px] font-black text-eduGreen-900 uppercase tracking-tighter">Grade {student.grade?.level || "?"}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-950/50 rounded-xl border border-zinc-900 text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover:border-zinc-800 group-hover:text-zinc-400 transition-all">
                                            <BookOpen className="w-3.5 h-3.5 text-zinc-700 group-hover:text-eduGreen-600 transition-colors" />
                                            {student.class ? student.class.name : "Unassigned"}
                                        </div>
                                        {student.userId && me?.user_metadata?.role !== 'STUDENT' ? (
                                            <Link href={`/dashboard/messages?userId=${student.userId}`}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Message Student"
                                                    className="w-10 h-10 rounded-xl text-zinc-400 hover:text-eduGreen-500 hover:bg-eduGreen-950/20 hover:border-eduGreen-900/30 border border-transparent transition-all"
                                                >
                                                    <MessageSquare className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                disabled
                                                title="Student not registered yet"
                                                className="w-10 h-10 rounded-xl text-zinc-800 opacity-50 cursor-not-allowed"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                            </Button>
                                        )}
                                        {student.parentLinks?.[0]?.parent && (
                                            <Link href={`/dashboard/messages?userId=${student.parentLinks[0].parent.id}`}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Message Guardian"
                                                    className="w-10 h-10 rounded-xl text-zinc-400 hover:text-amber-500 hover:bg-amber-950/20 hover:border-amber-900/30 border border-transparent transition-all"
                                                >
                                                    <Shield className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                        )}
                                        <Link href={`/dashboard/students/${student.id}`}>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-[10px] font-black text-zinc-800 uppercase tracking-[0.3em] hover:text-white hover:bg-zinc-800 transition-all rounded-lg"
                                            >
                                                Configure
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            <AlertModal
                isOpen={showAlert}
                onClose={() => setShowAlert(false)}
                title="Personnel Registered"
                message="The student has been successfully enrolled and indexed within the institutional body."
                variant="success"
            />
        </div>
    );
}
