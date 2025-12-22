"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar, Plus, Trash2, MapPin, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";

export default function EventsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: "", description: "", date: "" });
    const [loading, setLoading] = useState(true);
    const [createLoading, setCreateLoading] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await fetch('/api/school/events');
            const data = await res.json();
            if (data.events) setEvents(data.events);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateLoading(true);
        try {
            await fetch('/api/school/events', {
                method: 'POST',
                body: JSON.stringify(newEvent)
            });
            setIsCreating(false);
            setNewEvent({ title: "", description: "", date: "" });
            fetchEvents();
        } finally {
            setCreateLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        setDeleteId(id);
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await fetch(`/api/school/events?id=${deleteId}`, { method: 'DELETE' });
            fetchEvents();
        } finally {
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700 relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-eduGreen-950/20 border border-eduGreen-900/30 text-[10px] font-black text-eduGreen-500 uppercase tracking-widest mb-4">
                        <Calendar className="w-3 h-3 text-eduGreen-500" />
                        <span>Institutional Timeline</span>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight">Institutional Events</h1>
                    <p className="text-zinc-500 mt-2 font-bold text-sm leading-relaxed max-w-2xl">
                        Orchestrate school activities, academic deadlines, and community engagements in a unified timeline.
                    </p>
                </div>

                <Button
                    onClick={() => setIsCreating(true)}
                    className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-eduGreen-900/20 transition-all active:scale-95"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    New Event
                </Button>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => (
                    <Card key={event.id} className="group relative bg-zinc-950/50 backdrop-blur-2xl border-zinc-900 rounded-[2.5rem] overflow-hidden hover:border-eduGreen-900/40 transition-all border-t-zinc-800/20 shadow-2xl h-full flex flex-col">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-eduGreen-600 via-eduGreen-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardHeader className="p-8 pb-4">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-xl group-hover:border-eduGreen-900/30 transition-colors">
                                    <Calendar className="w-5 h-5 text-zinc-500 group-hover:text-eduGreen-500 transition-colors" />
                                </div>
                                <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] bg-zinc-950/50 px-3 py-1.5 rounded-lg border border-zinc-900 group-hover:text-eduGreen-500 group-hover:border-eduGreen-900/20 transition-all">
                                    {new Date(event.eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                            </div>
                            <CardTitle className="text-xl font-black text-zinc-100 group-hover:text-white transition-colors tracking-tight leading-tight">{event.title}</CardTitle>
                            <CardDescription className="text-zinc-500 font-bold text-sm mt-3 leading-relaxed line-clamp-2">{event.description || "No tactical details provided for this event sequence."}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 mt-auto">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/50 rounded-xl text-[10px] font-black text-zinc-500 uppercase tracking-widest border border-zinc-900 group-hover:border-zinc-800 transition-all">
                                        <Clock className="w-3.5 h-3.5 text-zinc-700 group-hover:text-eduGreen-600 transition-colors" />
                                        {new Date(event.eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(event.id)}
                                    className="h-10 w-10 text-zinc-800 hover:text-red-500 hover:bg-red-950/20 rounded-xl transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {events.length === 0 && !loading && (
                <div className="p-24 text-center flex flex-col items-center gap-6 bg-zinc-950/30 rounded-[3rem] border-2 border-dashed border-zinc-900">
                    <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center opacity-20">
                        <Calendar className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <p className="text-zinc-700 font-black uppercase tracking-[0.4em] text-xs">No Scheduled Operations</p>
                        <p className="text-zinc-800 text-[10px] font-bold uppercase tracking-widest mt-2">Institutional registry is awaiting new entries</p>
                    </div>
                </div>
            )}

            <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <DialogContent className="bg-zinc-950 border-zinc-900 rounded-[2.5rem] p-10 max-w-xl shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                    <DialogHeader className="mb-8">
                        <DialogTitle className="text-3xl font-black text-white tracking-tight">Event Matrix</DialogTitle>
                        <CardDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mt-1">Initialize new institutional event sequence</CardDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-2">Operation Identity</label>
                            <Input
                                placeholder="Event Title"
                                value={newEvent.title}
                                onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                required
                                className="bg-zinc-900/30 border-zinc-800 text-white h-14 rounded-2xl focus:border-eduGreen-600 transition-all border-2 text-lg font-black"
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-2">Tactical Breifing</label>
                            <Input
                                placeholder="Contextual details (Optional)"
                                value={newEvent.description}
                                onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                                className="bg-zinc-900/30 border-zinc-800 text-white h-14 rounded-2xl focus:border-eduGreen-600 transition-all border-2"
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-2">Temporal Placement</label>
                            <Input
                                type="datetime-local"
                                value={newEvent.date}
                                onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                                required
                                className="bg-zinc-900/30 border-zinc-800 text-white h-14 rounded-2xl focus:border-eduGreen-600 transition-all border-2 font-mono"
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-6 border-t border-zinc-900/50">
                            <Button type="button" variant="ghost" disabled={createLoading} onClick={() => setIsCreating(false)} className="text-zinc-600 hover:text-white font-black uppercase tracking-[0.2em] text-[10px] h-14 px-8">Abort</Button>
                            <Button type="submit" isLoading={createLoading} className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white h-14 px-10 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-eduGreen-900/20">Confirm Deployment</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={executeDelete}
                title="Purge Event"
                description="Are you sure you want to expunge this event from the institutional timeline? This action will synchronize across all faculty calendars."
                confirmText="Expunge"
                variant="danger"
            />
        </div>
    );
}
