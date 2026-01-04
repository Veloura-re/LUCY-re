"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, GripVertical, Save, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ColumnConfig {
    id?: string;
    title: string;
    maxMarks: number;
    order: number;
    isOptional: boolean;
}

export default function MarklistConfigPage() {
    const router = useRouter();

    // Selection State
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);

    const [selectedClassId, setSelectedClassId] = useState("");
    const [selectedSubjectId, setSelectedSubjectId] = useState("");

    // Config State
    const [configId, setConfigId] = useState<string | null>(null);
    const [columns, setColumns] = useState<ColumnConfig[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Load Metadata
    useEffect(() => {
        fetchClasses();
        fetchSubjects();
    }, []);

    const fetchClasses = async () => {
        try {
            const res = await fetch("/api/school/classes");
            if (res.ok) {
                const data = await res.json();
                // API returns { grades: [{ classes: [...] }] }
                // We need to flatten this to get all classes
                const flatClasses = data.grades?.flatMap((g: any) => g.classes) || [];
                setClasses(flatClasses);
            }
        } catch (e) { console.error("Classes fetch failed", e); }
    };

    const fetchSubjects = async () => {
        try {
            const res = await fetch("/api/school/subjects");
            // API returns { subjects: [...] }
            if (res.ok) {
                const data = await res.json();
                setSubjects(data.subjects || []);
            }
        } catch (e) { console.error("Subjects fetch failed", e); }
    };

    // Fetch Config when selection changes
    const loadConfig = async () => {
        if (!selectedClassId || !selectedSubjectId) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/marklist/config?classId=${selectedClassId}&subjectId=${selectedSubjectId}`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.columns) {
                    setConfigId(data.id);
                    setColumns(data.columns.map((c: any) => ({
                        id: c.id,
                        title: c.title,
                        maxMarks: c.maxMarks,
                        order: c.order,
                        isOptional: c.isOptional
                    })));
                } else {
                    // Reset if no config found (New)
                    setConfigId(null);
                    setColumns([
                        { title: "Quiz 1", maxMarks: 20, order: 0, isOptional: false },
                        { title: "Mid Term", maxMarks: 50, order: 1, isOptional: false }
                    ]);
                }
            }
        } catch (e) {
            toast.error("Failed to load configuration");
        } finally {
            setIsLoading(false);
        }
    };

    const addColumn = () => {
        setColumns([...columns, {
            title: "New Assessment",
            maxMarks: 10,
            order: columns.length,
            isOptional: false
        }]);
    };

    const updateColumn = (index: number, field: keyof ColumnConfig, value: any) => {
        const newCols = [...columns];
        newCols[index] = { ...newCols[index], [field]: value };
        setColumns(newCols);
    };

    const removeColumn = (index: number) => {
        setColumns(columns.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!selectedClassId || !selectedSubjectId) {
            toast.error("Please select Class and Subject");
            return;
        }

        // Validate
        if (columns.length === 0) {
            toast.error("At least one assessment column is required");
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                // Need to get schoolId from context or fetch. 
                // For MVP, passing a placeholder or relying on server to infer/fetch if token has it.
                // Or we pass the first class's schoolId if available.
                // Let's assume the API/Auth handles user's school context, 
                // BUT the API requires schoolId. 
                // We will pick it from the selected class object if possible.
                schoolId: classes.find(c => c.id === selectedClassId)?.schoolId,
                classId: selectedClassId,
                subjectId: selectedSubjectId,
                columns: columns.map((c, i) => ({ ...c, order: i })) // Ensure order
            };

            const res = await fetch("/api/marklist/config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                setConfigId(data.id);
                toast.success("Design Saved Successfully");
            } else {
                toast.error("Failed to save design");
            }
        } catch (e) {
            console.error(e);
            toast.error("Error saving");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight">Marklist Designer</h1>
                    <p className="text-muted-foreground font-medium">Configure Dynamic Assessment Logic</p>
                </div>
                {configId && (
                    <Button
                        variant="outline"
                        className="gap-2 border-primary/20 hover:bg-primary/10 text-primary font-bold"
                        onClick={() => router.push(`/dashboard/marklist/view?configId=${configId}`)}
                    >
                        <FileSpreadsheet className="w-4 h-4" /> Open Live Marklist
                    </Button>
                )}
            </div>

            <Card className="bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 rounded-[2.5rem] overflow-hidden shadow-none">
                <CardHeader className="p-10 border-b border-zinc-900/30 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-black text-white tracking-tight leading-tight">Context Selection</CardTitle>
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mt-1">Define Academic Parameters</p>
                    </div>
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div className="space-y-2">
                        <Label>Class / Section</Label>
                        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Class" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Subject</Label>
                        <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Subject" />
                            </SelectTrigger>
                            <SelectContent>
                                {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        onClick={loadConfig}
                        disabled={!selectedClassId || !selectedSubjectId || isLoading}
                        className="font-bold uppercase tracking-wide"
                    >
                        {isLoading ? "Loading..." : "Load Configuration"}
                    </Button>
                </CardContent>
            </Card>

            {(selectedClassId && selectedSubjectId) && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    <div className="grid gap-4">
                        {columns.map((col, idx) => (
                            <Card key={idx} className="group relative overflow-hidden border-zinc-900/50 bg-zinc-950/20 hover:bg-zinc-900/10 transition-all rounded-[1.5rem] shadow-none">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-900 group-hover:bg-eduGreen-600 transition-colors" />
                                <CardContent className="p-6 flex items-center gap-6">
                                    <div className="text-muted-foreground cursor-grab active:cursor-grabbing">
                                        <GripVertical className="w-5 h-5" />
                                    </div>

                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                                        <div className="md:col-span-5 space-y-1">
                                            <Label className="text-xs uppercase text-muted-foreground font-bold">Assessment Name</Label>
                                            <Input
                                                value={col.title}
                                                onChange={(e) => updateColumn(idx, "title", e.target.value)}
                                                className="font-bold text-lg border-transparent hover:border-input focus:border-primary transition-all bg-transparent px-0"
                                                placeholder="e.g. Quiz 1"
                                            />
                                        </div>

                                        <div className="md:col-span-3 space-y-1">
                                            <Label className="text-xs uppercase text-muted-foreground font-bold">Max Marks</Label>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    value={col.maxMarks}
                                                    onChange={(e) => updateColumn(idx, "maxMarks", parseFloat(e.target.value))}
                                                    className="font-mono font-bold"
                                                />
                                                <span className="text-xs font-bold text-muted-foreground">PTS</span>
                                            </div>
                                        </div>

                                        <div className="md:col-span-3 flex items-center gap-2">
                                            <Switch
                                                checked={col.isOptional}
                                                onCheckedChange={(c) => updateColumn(idx, "isOptional", c)}
                                            />
                                            <Label className="text-sm font-medium">Optional (Not counted if empty)</Label>
                                        </div>

                                        <div className="md:col-span-1 flex justify-end">
                                            <Button variant="ghost" size="icon" onClick={() => removeColumn(idx)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        <Button onClick={addColumn} variant="outline" className="h-14 flex-1 border-dashed border-2 hover:border-primary hover:text-primary transition-all font-bold uppercase tracking-widest text-muted-foreground">
                            <Plus className="w-5 h-5 mr-2" /> Add Assessment Column
                        </Button>
                    </div>

                    <div className="flex justify-end pt-8 border-t">
                        <Button size="lg" onClick={handleSave} disabled={isSaving} className="px-12 h-14 text-lg font-black uppercase tracking-widest shadow-xl shadow-primary/20">
                            {isSaving ? "Saving..." : "Save Chart Logic"}
                        </Button>
                    </div>

                </div>
            )}
        </div>
    );
}
