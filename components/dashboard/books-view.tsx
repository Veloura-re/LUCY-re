"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Book,
    Download,
    Plus,
    Trash2,
    Search,
    Filter,
    BookOpen,
    GraduationCap,
    Layers,
    FileText,
    ExternalLink,
    Zap,
    X,
    Upload
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { SpringingLoader } from "@/components/dashboard/springing-loader";
import { FlipBookViewer } from "@/components/dashboard/flip-book-viewer";

interface BooksViewProps {
    user: any;
    school: any;
}

export function BooksView({ user, school }: BooksViewProps) {
    const [books, setBooks] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [progress, setProgress] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [showRequests, setShowRequests] = useState(false);
    const [selectedBook, setSelectedBook] = useState<any | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [gradeFilter, setGradeFilter] = useState("ALL");
    const [activeTab, setActiveTab] = useState<'library' | 'units' | 'requests'>('library');
    const [requestModal, setRequestModal] = useState(false);
    const [unitModal, setUnitModal] = useState(false);

    const updateRequestStatus = async (id: string, status: string) => {
        try {
            const res = await fetch('/api/school/books/requests', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });
            if (res.ok) {
                toast.success(`Request ${status.toLowerCase()}ed`);
                fetchBooks();
            }
        } catch (e) {
            toast.error("Status update protocol synchronization failure");
        }
    };

    const handleDeleteUnit = async (id: string) => {
        try {
            const res = await fetch(`/api/school/books/units/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Unit pack decommissioned");
                fetchBooks();
            }
        } catch (e) {
            toast.error("Decommissioning protocol error");
        }
    };

    // Metadata for dropdowns
    const [grades, setGrades] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);

    useEffect(() => {
        fetchInitialData();
        fetchBooks();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [gRes, sRes] = await Promise.all([
                fetch('/api/school/grades'),
                fetch('/api/school/subjects')
            ]);
            setGrades(await gRes.json());
            setSubjects(await sRes.json());
        } catch (e) {
            console.error("Data uplink failed:", e);
        }
    };

    const fetchBooks = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/school/books');
            const data = await res.json();
            setBooks(data);

            // Parallel fetch of other components
            Promise.all([
                fetch('/api/school/books/units').then(r => r.json()).then(setUnits),
                fetch('/api/school/books/requests').then(r => r.json()).then(setRequests),
                fetch('/api/school/books/progress').then(r => r.json()).then(setProgress)
            ].map(p => p.catch(console.error)));
        } catch (e) {
            toast.error("Failed to retrieve library records");
        } finally {
            setLoading(false);
        }
    };

    const toggleProgress = async (bookId: string, currentStatus: boolean) => {
        try {
            const res = await fetch('/api/school/books/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookId, completed: !currentStatus })
            });
            if (res.ok) {
                const updated = await res.json();
                setProgress(prev => {
                    const exists = prev.find(p => p.bookId === bookId);
                    if (exists) return prev.map(p => p.bookId === bookId ? updated : p);
                    return [...prev, updated];
                });
                toast.success(!currentStatus ? "Mastery recorded" : "Progress reset");
            }
        } catch (e) {
            toast.error("Failed to update progress protocol");
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await fetch(`/api/school/books/${deleteId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Resource decommissioned successfully");
                fetchBooks();
            }
        } catch (e) {
            toast.error("Decommissioning failed");
        } finally {
            setDeleteId(null);
        }
    };

    const filteredBooks = books.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (book.author?.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesGrade = gradeFilter === "ALL" || book.gradeId === gradeFilter;
        return matchesSearch && matchesGrade;
    });

    const isDirector = user.role === 'PRINCIPAL' || user.role === 'SUPERADMIN';

    if (loading) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <SpringingLoader message="Accessing Institutional Library" />
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-1000 relative z-10 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-900 pb-10">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">
                        Learning <span className="text-eduGreen-500 not-italic">Nexus</span>
                    </h1>
                    <p className="text-zinc-600 font-bold uppercase tracking-[0.2em] text-xs mt-3">Centralized Academic Resource Repository</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                        <Input
                            placeholder="Find Resources..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-14 w-64 pl-12 bg-zinc-950 border-zinc-900 rounded-2xl focus:border-eduGreen-500 transition-all font-bold text-xs"
                        />
                    </div>
                    {isDirector ? (
                        <Button
                            onClick={() => setIsUploading(true)}
                            className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white h-14 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl transition-all active:scale-95 shadow-eduGreen-900/20"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Deploy Material
                        </Button>
                    ) : (
                        <Button
                            onClick={() => setRequestModal(true)}
                            className="bg-zinc-900 hover:bg-zinc-800 text-white h-14 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                        >
                            <Zap className="mr-2 h-4 w-4 text-eduGreen-500" /> Request Resource
                        </Button>
                    )}
                </div>
            </div>

            {/* Sub-Hub Navigation */}
            <div className="flex items-center gap-8 border-b border-zinc-900/50 pb-6">
                {[
                    { id: 'library', label: 'Institutional Library', icon: Book },
                    { id: 'units', label: 'Unit Bundles', icon: Layers },
                    { id: 'requests', label: 'Resource Wishes', icon: FileText }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "flex items-center gap-3 transition-all relative group",
                            activeTab === tab.id ? "text-white" : "text-zinc-600 hover:text-zinc-400"
                        )}
                    >
                        <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-eduGreen-500" : "")} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{tab.label}</span>
                        {activeTab === tab.id && (
                            <motion.div layoutId="activeTab" className="absolute -bottom-6 left-0 w-full h-[2px] bg-eduGreen-500" />
                        )}
                    </button>
                ))}
            </div>

            {/* Quick Filters - Only for Library */}
            {activeTab === 'library' && (
                <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    <Button
                        variant="ghost"
                        onClick={() => setGradeFilter("ALL")}
                        className={cn(
                            "rounded-xl h-10 px-6 font-black text-[9px] uppercase tracking-widest border transition-all whitespace-nowrap",
                            gradeFilter === "ALL" ? "bg-white text-black border-white" : "border-zinc-900 text-zinc-600 hover:text-white"
                        )}
                    >
                        All Grades
                    </Button>
                    {grades.map(grade => (
                        <Button
                            key={grade.id}
                            variant="ghost"
                            onClick={() => setGradeFilter(grade.id)}
                            className={cn(
                                "rounded-xl h-10 px-6 font-black text-[9px] uppercase tracking-widest border transition-all whitespace-nowrap",
                                gradeFilter === grade.id ? "bg-eduGreen-600 text-white border-eduGreen-600" : "border-zinc-900 text-zinc-600 hover:text-white"
                            )}
                        >
                            Grade {grade.level}
                        </Button>
                    ))}
                </div>
            )}

            {/* Active Section Content */}
            {activeTab === 'library' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence>
                        {filteredBooks.map((book, i) => {
                            const isCompleted = progress.find(p => p.bookId === book.id)?.completed;
                            const isLocked = book.prerequisiteId && !progress.find(p => p.bookId === book.prerequisiteId)?.completed;
                            const isExpired = book.expiresAt && new Date(book.expiresAt) < new Date();

                            return (
                                <motion.div
                                    key={book.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.4, delay: i * 0.05 }}
                                >
                                    <Card className={cn(
                                        "group relative bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 rounded-[2.5rem] overflow-hidden hover:border-eduGreen-900/30 transition-all border-t-zinc-800/10 shadow-2xl h-full flex flex-col",
                                        isLocked ? "opacity-60 grayscale scale-[0.98]" : "",
                                        isExpired ? "border-red-900/30" : ""
                                    )}>
                                        <div className={cn(
                                            "absolute top-0 left-0 w-full h-[2px] transition-opacity",
                                            isCompleted ? "bg-eduGreen-500 opacity-100" : "bg-gradient-to-r from-eduGreen-600 via-emerald-500 to-transparent opacity-0 group-hover:opacity-100"
                                        )} />

                                        <CardHeader className="p-8 pb-4">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className={cn(
                                                    "p-3 rounded-xl border transition-all",
                                                    isCompleted ? "bg-eduGreen-500/10 border-eduGreen-500/20 text-eduGreen-500" : "bg-zinc-900/50 border-zinc-800 text-eduGreen-500"
                                                )}>
                                                    {isLocked ? <Zap className="w-6 h-6 text-zinc-700" /> : <BookOpen className="w-6 h-6" />}
                                                </div>
                                                <div className="px-2 py-1 bg-eduGreen-500/10 border border-eduGreen-500/20 rounded-lg">
                                                    <span className="text-[8px] font-black text-eduGreen-500 uppercase tracking-widest italic">
                                                        {book.subject.name}
                                                    </span>
                                                </div>
                                            </div>
                                            <CardTitle className="text-xl font-black text-white leading-tight tracking-tight group-hover:text-eduGreen-500 transition-colors">
                                                {book.title}
                                            </CardTitle>
                                            {isLocked ? (
                                                <div className="flex items-center gap-2 mt-4 text-red-500">
                                                    <X className="w-3 h-3" />
                                                    <span className="text-[8px] font-black uppercase tracking-widest">Locked: Complete Prerequisite</span>
                                                </div>
                                            ) : isExpired ? (
                                                <div className="flex items-center gap-2 mt-4 text-zinc-600">
                                                    <X className="w-3 h-3" />
                                                    <span className="text-[8px] font-black uppercase tracking-widest">Seasonal Availability Expired</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 mt-4">
                                                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest px-2 py-1 bg-zinc-900 rounded-md border border-zinc-800">
                                                        Grade {book.grade.level}
                                                    </span>
                                                    <span className="text-[8px] font-black text-eduGreen-900 uppercase tracking-tighter">
                                                        Section: {book.class.name}
                                                    </span>
                                                </div>
                                            )}
                                        </CardHeader>

                                        <CardContent className="px-8 flex-1">
                                            <p className="text-xs text-zinc-500 font-medium line-clamp-2 leading-relaxed italic">
                                                {book.description || "Comprehensive academic resource for institutional mastery."}
                                            </p>

                                            {book.teacherNote && (
                                                <div className="mt-6 p-4 bg-eduGreen-500/5 border border-eduGreen-500/10 rounded-2xl relative overflow-hidden group/note">
                                                    <div className="absolute top-0 right-0 p-2 opacity-20"><Zap className="w-3 h-3 text-eduGreen-500" /></div>
                                                    <p className="text-[9px] font-black text-eduGreen-500 uppercase tracking-widest mb-1">Pedagogical Note</p>
                                                    <p className="text-[10px] text-zinc-400 font-bold leading-relaxed">{book.teacherNote}</p>
                                                </div>
                                            )}

                                            <div className="mt-6 flex flex-wrap gap-4">
                                                {book.author && (
                                                    <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-700 uppercase tracking-widest">
                                                        <Layers className="w-3 h-3" />
                                                        <span>{book.author}</span>
                                                    </div>
                                                )}
                                                {book.edition && (
                                                    <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-700 uppercase tracking-widest">
                                                        <Zap className="w-3 h-3" />
                                                        <span>{book.edition}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>

                                        <CardFooter className="px-8 pb-8 pt-6 flex justify-between items-center bg-zinc-900/20">
                                            <div className="flex gap-2">
                                                <Button
                                                    disabled={isLocked || isExpired}
                                                    onClick={() => setSelectedBook(book)}
                                                    className="h-12 px-6 bg-zinc-900 hover:bg-eduGreen-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                                                >
                                                    <BookOpen className="w-4 h-4" /> Start Reading
                                                </Button>
                                                {!isDirector && (
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => toggleProgress(book.id, isCompleted)}
                                                        className={cn(
                                                            "h-12 w-12 p-0 rounded-xl transition-all",
                                                            isCompleted ? "bg-eduGreen-500 text-white" : "bg-zinc-950 text-zinc-600 hover:text-white border border-zinc-900"
                                                        )}
                                                    >
                                                        <Zap className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>

                                            {isDirector && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeleteId(book.id)}
                                                    className="w-12 h-12 text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {filteredBooks.length === 0 && (
                        <div className="col-span-full py-32 text-center">
                            <div className="w-24 h-24 bg-zinc-950 rounded-full flex items-center justify-center border border-zinc-900 mx-auto mb-6 opacity-30">
                                <Book className="w-12 h-12 text-zinc-500" />
                            </div>
                            <h3 className="text-zinc-600 font-black uppercase tracking-[0.4em] text-xs">Library records not found</h3>
                            <p className="text-zinc-800 text-[10px] font-bold uppercase mt-2">No scholarly resources available for selected parameters</p>
                        </div>
                    )}
                </div>
            )}

            {/* Units Section */}
            {activeTab === 'units' && (
                <div className="space-y-8">
                    {isDirector && (
                        <div className="flex justify-end">
                            <Button
                                onClick={() => setUnitModal(true)}
                                className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Synthesize Unit Pack
                            </Button>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {units.map((unit) => (
                            <Card key={unit.id} className="bg-zinc-950/40 border-zinc-900 rounded-[3rem] overflow-hidden p-8 flex flex-col gap-6 group hover:border-eduGreen-900/30 transition-all shadow-2xl relative">
                                {isDirector && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteUnit(unit.id)}
                                        className="absolute top-6 right-6 w-10 h-10 text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 text-eduGreen-500">
                                            <Layers className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white group-hover:text-eduGreen-500 transition-colors uppercase">{unit.title}</h3>
                                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-1">Institutional Learning Bundle</p>
                                        </div>
                                    </div>
                                    <span className="text-[8px] font-black text-zinc-800 uppercase px-3 py-1 bg-zinc-900 rounded-lg">{unit.resources.length} Materials</span>
                                </div>

                                <p className="text-xs text-zinc-500 font-medium leading-relaxed italic">{unit.description || "Synthesized academic pathway for streamlined mastery."}</p>

                                <div className="space-y-3">
                                    {unit.resources.map((res: any, idx: number) => (
                                        <div key={res.id} className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-900 rounded-2xl group/item hover:bg-zinc-900 transition-all">
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] font-black text-zinc-700 uppercase">#{idx + 1}</span>
                                                <span className="text-xs font-bold text-zinc-400 group-hover/item:text-white transition-colors">{res.book.title}</span>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => setSelectedBook(res.book)} className="text-zinc-700 hover:text-eduGreen-500"><Zap className="w-4 h-4" /></Button>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        ))}
                        {units.length === 0 && (
                            <div className="col-span-full py-32 text-center border-2 border-dashed border-zinc-900 rounded-[3rem]">
                                <Layers className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">No integrated unit packs detected in local cloud</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Requests Section */}
            {activeTab === 'requests' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {requests.map((req) => (
                            <Card key={req.id} className="bg-zinc-950/40 border-zinc-900 rounded-[2.5rem] p-8 space-y-4 relative overflow-hidden group">
                                <div className={cn(
                                    "absolute top-0 right-0 px-4 py-2 text-[8px] font-black uppercase tracking-widest rounded-bl-2xl border-l border-b border-zinc-900",
                                    req.status === 'PENDING' ? "bg-amber-500/10 text-amber-500" :
                                        req.status === 'APPROVED' ? "bg-eduGreen-500/10 text-eduGreen-500" :
                                            "bg-red-500/10 text-red-500"
                                )}>
                                    {req.status}
                                </div>
                                <h4 className="text-lg font-black text-white uppercase pr-16">{req.title}</h4>
                                <div className="flex items-center gap-3">
                                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest px-2 py-1 bg-zinc-900 rounded">{req.subject || "General"}</span>
                                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest px-2 py-1 bg-zinc-900 rounded">{req.grade || "All"}</span>
                                </div>
                                <p className="text-[10px] text-zinc-500 font-bold leading-relaxed">{req.reason || "No context provided."}</p>

                                {isDirector && req.status === 'PENDING' && (
                                    <div className="flex gap-2 pt-4">
                                        <Button
                                            onClick={() => updateRequestStatus(req.id, 'APPROVED')}
                                            className="h-10 flex-1 bg-eduGreen-600 hover:bg-eduGreen-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest"
                                        >
                                            Approve
                                        </Button>
                                        <Button
                                            onClick={() => updateRequestStatus(req.id, 'REJECTED')}
                                            variant="ghost"
                                            className="h-10 flex-1 bg-zinc-900 hover:bg-red-500/10 text-zinc-500 hover:text-red-500 rounded-xl font-black text-[9px] uppercase tracking-widest"
                                        >
                                            Reject
                                        </Button>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-zinc-900 flex justify-between items-center text-[8px] font-black text-zinc-700 uppercase">
                                    <span>Requested By: {req.user.name}</span>
                                    <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Modals */}
            <AnimatePresence>
                {isUploading && (
                    <BookUploadModal
                        onClose={() => setIsUploading(false)}
                        onSuccess={() => {
                            fetchBooks();
                            setIsUploading(false);
                        }}
                        grades={grades}
                        subjects={subjects}
                        books={books} // For prerequisites
                    />
                )}
                {requestModal && (
                    <BookRequestModal
                        onClose={() => setRequestModal(false)}
                        onSuccess={() => {
                            fetchBooks(); // Refresh requests
                            setRequestModal(false);
                        }}
                    />
                )}
                {unitModal && (
                    <UnitPackModal
                        onClose={() => setUnitModal(false)}
                        onSuccess={() => {
                            fetchBooks();
                            setUnitModal(false);
                        }}
                        books={books}
                    />
                )}
            </AnimatePresence>

            {/* FlipBook Viewer Instance */}
            <FlipBookViewer
                isOpen={!!selectedBook}
                onClose={() => setSelectedBook(null)}
                title={selectedBook?.title || ""}
                fileUrl={selectedBook?.fileUrl || ""}
            />

            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Decommission Resource"
                description="This action will permanently remove this material from the institutional library. Scholars will lose instant access."
                confirmText="Decommission"
                variant="danger"
            />
        </div>
    );
}

function UnitPackModal({ onClose, onSuccess, books }: any) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        resourceIds: [] as string[]
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.resourceIds.length === 0) {
            toast.error("Cluster required: Select at least one resource");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/school/books/units', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                toast.success("Learning Unit synthesized and deployed");
                onSuccess();
            }
        } catch (e) {
            toast.error("Synthesis protocol failure");
        } finally {
            setLoading(false);
        }
    };

    const toggleResource = (id: string) => {
        setFormData(prev => ({
            ...prev,
            resourceIds: prev.resourceIds.includes(id)
                ? prev.resourceIds.filter(i => i !== id)
                : [...prev.resourceIds, id]
        }));
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-2xl bg-zinc-950 border border-zinc-900 rounded-[3.5rem] overflow-hidden shadow-2xl"
            >
                <div className="p-10 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/20">
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Unit Synthesizer</h2>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-1 italic">Bundling institutional intelligence packs</p>
                    </div>
                    <Button variant="ghost" onClick={onClose} size="icon" className="text-zinc-600 hover:text-white rounded-full">
                        <X className="w-6 h-6" />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto max-h-[70vh] scrollbar-hide">
                    <div className="space-y-4">
                        <Input
                            placeholder="Unit Title (e.g., Quantum Mechanics Fundamentals)"
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="h-16 bg-zinc-900 border-zinc-800 rounded-2xl font-bold text-lg"
                        />
                        <textarea
                            placeholder="Unit Description / Objectives..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-sm font-bold focus:border-eduGreen-500 outline-none text-white resize-none"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Select Instructional Resources</label>
                        <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-2 scrollbar-hide">
                            {books.map((book: any) => (
                                <button
                                    key={book.id}
                                    type="button"
                                    onClick={() => toggleResource(book.id)}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                                        formData.resourceIds.includes(book.id)
                                            ? "bg-eduGreen-500/10 border-eduGreen-500 text-white"
                                            : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-4 h-4 rounded border flex items-center justify-center transition-all",
                                            formData.resourceIds.includes(book.id) ? "bg-eduGreen-500 border-eduGreen-500" : "border-zinc-700"
                                        )}>
                                            {formData.resourceIds.includes(book.id) && <Zap className="w-3 h-3 text-black" />}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold leading-none">{book.title}</p>
                                            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600 mt-1">{book.subject.name} • Grade {book.grade.level}</p>
                                        </div>
                                    </div>
                                    <span className="text-[8px] font-black uppercase text-zinc-800 italic">{book.author || "Institutional"}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-20 bg-white text-black hover:bg-eduGreen-600 hover:text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] transition-all"
                    >
                        {loading ? "Synthesizing Pack..." : "Authorize Unit Deployment"}
                    </Button>
                </form>
            </motion.div>
        </motion.div>
    );
}

function BookRequestModal({ onClose, onSuccess }: any) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        subject: "",
        grade: "",
        reason: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/school/books/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                toast.success("Resource wish broadasted to Directors");
                onSuccess();
            }
        } catch (e) {
            toast.error("Subspace transmission failure");
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-lg bg-zinc-950 border border-zinc-900 rounded-[3rem] overflow-hidden shadow-2xl"
            >
                <div className="p-10 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/40">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight uppercase">Request Resource</h2>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-1 italic">Submit pedagogical requirements</p>
                    </div>
                    <Button variant="ghost" onClick={onClose} size="icon" className="text-zinc-600 hover:text-white rounded-full">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-6">
                    <Input
                        placeholder="Desired Material Title"
                        required
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="h-14 bg-zinc-900 border-zinc-900 rounded-2xl font-bold"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            placeholder="Subject"
                            value={formData.subject}
                            onChange={e => setFormData({ ...formData, subject: e.target.value })}
                            className="h-14 bg-zinc-900 border-zinc-900 rounded-2xl font-bold"
                        />
                        <Input
                            placeholder="Grade Level"
                            value={formData.grade}
                            onChange={e => setFormData({ ...formData, grade: e.target.value })}
                            className="h-14 bg-zinc-900 border-zinc-900 rounded-2xl font-bold"
                        />
                    </div>
                    <textarea
                        placeholder="Reason for request / Pedagogical context..."
                        value={formData.reason}
                        onChange={e => setFormData({ ...formData, reason: e.target.value })}
                        className="w-full h-32 bg-zinc-900 border border-zinc-900 rounded-3xl p-6 text-sm font-bold focus:border-eduGreen-500 outline-none text-white resize-none"
                    />
                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-16 bg-white text-black hover:bg-eduGreen-600 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all"
                    >
                        {loading ? "Transmitting..." : "Authorize Request"}
                    </Button>
                </form>
            </motion.div>
        </motion.div>
    );
}

function BookUploadModal({ onClose, onSuccess, grades, subjects, books }: any) {
    const [loading, setLoading] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [payloadSource, setPayloadSource] = useState<'link' | 'file'>('file');
    const [classes, setClasses] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        title: "",
        fileUrl: "",
        gradeId: "",
        classId: "",
        subjectId: "",
        author: "",
        academicYear: "",
        edition: "",
        description: "",
        teacherNote: "",
        expiresAt: "",
        prerequisiteId: ""
    });

    useEffect(() => {
        if (formData.gradeId) {
            fetch(`/api/school/grades/${formData.gradeId}/classes`)
                .then(res => res.json())
                .then(setClasses)
                .catch(console.error);
        } else {
            setClasses([]);
        }
    }, [formData.gradeId]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingFile(true);
        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            const res = await fetch('/api/school/books/upload', {
                method: 'POST',
                body: uploadData
            });

            if (res.ok) {
                const data = await res.json();
                setFormData(prev => ({ ...prev, fileUrl: data.url, title: prev.title || file.name.split('.')[0] }));
                toast.success("File uploaded to institutional cloud");
            } else {
                const err = await res.json();
                toast.error(err.error || "Upload failed");
            }
        } catch (e) {
            toast.error("Network error during upload");
        } finally {
            setUploadingFile(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.fileUrl) {
            toast.error("Payload missing: Please upload a file or provide a link");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/school/books', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                toast.success("Academic resource deployed");
                onSuccess();
            } else {
                const msg = await res.text();
                toast.error(msg || "Deployment sequence failure");
            }
        } catch (e) {
            toast.error("Institutional protocol error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-2xl bg-zinc-950 border border-zinc-900 rounded-[3rem] overflow-hidden shadow-2xl"
            >
                <div className="p-10 border-b border-zinc-900 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight uppercase">Resource Terminal</h2>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-1 italic">Deploying new academic materials</p>
                    </div>
                    <Button variant="ghost" onClick={onClose} size="icon" className="text-zinc-600 hover:text-white rounded-full">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto max-h-[70vh] scrollbar-hide">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Mandatory Fields */}
                        <div className="space-y-4">
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-1">Identity & Payload</label>
                            <Input
                                placeholder="Resource Title"
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="h-14 bg-zinc-900 border-zinc-800 rounded-2xl font-bold"
                            />

                            <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 gap-1">
                                <button
                                    type="button"
                                    onClick={() => setPayloadSource('file')}
                                    className={cn(
                                        "flex-1 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                                        payloadSource === 'file' ? "bg-zinc-800 text-white" : "text-zinc-600 hover:text-zinc-400"
                                    )}
                                >
                                    Local File
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPayloadSource('link')}
                                    className={cn(
                                        "flex-1 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                                        payloadSource === 'link' ? "bg-zinc-800 text-white" : "text-zinc-600 hover:text-zinc-400"
                                    )}
                                >
                                    External Link
                                </button>
                            </div>

                            {payloadSource === 'file' ? (
                                <div className="relative group">
                                    <input
                                        type="file"
                                        id="book-upload"
                                        className="hidden"
                                        onChange={handleFileChange}
                                        disabled={uploadingFile}
                                        accept=".pdf,.epub,.docx,.txt"
                                    />
                                    <label
                                        htmlFor="book-upload"
                                        className={cn(
                                            "flex flex-col items-center justify-center h-28 border-2 border-dashed rounded-3xl cursor-pointer transition-all",
                                            uploadingFile ? "border-eduGreen-500 bg-eduGreen-500/5 animate-pulse" : "border-zinc-800 hover:border-eduGreen-900/50 bg-zinc-900/50 hover:bg-zinc-900",
                                            formData.fileUrl && !uploadingFile ? "border-eduGreen-600/50" : ""
                                        )}
                                    >
                                        {uploadingFile ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-5 h-5 border-2 border-eduGreen-500 border-t-transparent rounded-full animate-spin" />
                                                <span className="text-[8px] font-black text-eduGreen-500 uppercase">Uploading...</span>
                                            </div>
                                        ) : formData.fileUrl ? (
                                            <div className="flex flex-col items-center gap-2 text-eduGreen-500">
                                                <Zap className="w-5 h-5" />
                                                <span className="text-[8px] font-black uppercase">Payload Ready</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-zinc-600">
                                                <Upload className="w-5 h-5" />
                                                <span className="text-[8px] font-black uppercase">Click to Select File</span>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            ) : (
                                <Input
                                    placeholder="File URL (PDF/Digital Link)"
                                    required
                                    value={formData.fileUrl}
                                    onChange={e => setFormData({ ...formData, fileUrl: e.target.value })}
                                    className="h-14 bg-zinc-900 border-zinc-800 rounded-2xl font-bold"
                                />
                            )}
                        </div>

                        {/* Directives */}
                        <div className="space-y-4">
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-1">Deployment Target</label>
                            <select
                                required
                                value={formData.gradeId}
                                onChange={e => setFormData({ ...formData, gradeId: e.target.value, classId: "" })}
                                className="w-full h-14 bg-zinc-900 border border-zinc-800 rounded-2xl px-6 text-sm font-bold focus:border-eduGreen-500 outline-none text-white appearance-none"
                            >
                                <option value="">Select Target Grade</option>
                                {grades.map((g: any) => (
                                    <option key={g.id} value={g.id}>Grade {g.level}</option>
                                ))}
                            </select>

                            <select
                                required
                                disabled={!formData.gradeId}
                                value={formData.classId}
                                onChange={e => setFormData({ ...formData, classId: e.target.value })}
                                className="w-full h-14 bg-zinc-900 border border-zinc-800 rounded-2xl px-6 text-sm font-bold focus:border-eduGreen-500 outline-none text-white appearance-none disabled:opacity-50"
                            >
                                <option value="">Select Class Section</option>
                                {classes.map((c: any) => (
                                    <option key={c.id} value={c.id}>Section: {c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-1">Substantive Context</label>
                            <select
                                required
                                value={formData.subjectId}
                                onChange={e => setFormData({ ...formData, subjectId: e.target.value })}
                                className="w-full h-14 bg-zinc-900 border border-zinc-800 rounded-2xl px-6 text-sm font-bold focus:border-eduGreen-500 outline-none text-white appearance-none"
                            >
                                <option value="">Target Subject</option>
                                {subjects.map((s: any) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                            <Input
                                placeholder="Academic Year"
                                value={formData.academicYear}
                                onChange={e => setFormData({ ...formData, academicYear: e.target.value })}
                                className="h-14 bg-zinc-900 border-zinc-800 rounded-2xl font-bold"
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-1">Authorial Metadata</label>
                            <Input
                                placeholder="Principal Author"
                                value={formData.author}
                                onChange={e => setFormData({ ...formData, author: e.target.value })}
                                className="h-14 bg-zinc-900 border-zinc-800 rounded-2xl font-bold"
                            />
                            <Input
                                placeholder="Edition/Version"
                                value={formData.edition}
                                onChange={e => setFormData({ ...formData, edition: e.target.value })}
                                className="h-14 bg-zinc-900 border-zinc-900 rounded-2xl font-bold"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-1">Pedagogical Governance</label>
                            <select
                                value={formData.prerequisiteId}
                                onChange={e => setFormData({ ...formData, prerequisiteId: e.target.value })}
                                className="w-full h-14 bg-zinc-900 border border-zinc-900 rounded-2xl px-6 text-sm font-bold focus:border-eduGreen-500 outline-none text-white appearance-none"
                            >
                                <option value="">No Prerequisite</option>
                                {books.map((b: any) => (
                                    <option key={b.id} value={b.id}>{b.title}</option>
                                ))}
                            </select>
                            <Input
                                type="date"
                                placeholder="Expiry (Optional)"
                                value={formData.expiresAt}
                                onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                                className="h-14 bg-zinc-900 border-zinc-900 rounded-2xl font-bold"
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-1">Teacher Instructions</label>
                            <textarea
                                value={formData.teacherNote}
                                onChange={e => setFormData({ ...formData, teacherNote: e.target.value })}
                                placeholder="Instructions for students (Optional)..."
                                className="w-full h-28 bg-zinc-900 border border-zinc-900 rounded-2xl p-4 text-sm font-bold focus:border-eduGreen-500 outline-none text-white resize-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-1">Resource Description</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Optional: Brief abstract or instructional context..."
                            className="w-full h-24 bg-zinc-900 border border-zinc-900 rounded-3xl p-6 text-sm font-bold focus:border-eduGreen-500 outline-none text-white resize-none"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading || uploadingFile}
                        className="w-full h-20 bg-white text-black hover:bg-eduGreen-600 hover:text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.4em] transition-all"
                    >
                        {loading ? "Synchronizing..." : uploadingFile ? "Pending Upload..." : "Authorize Resource Deployment"}
                    </Button>
                </form>
            </motion.div>
        </motion.div>
    );
}
