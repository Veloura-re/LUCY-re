"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Send, User, MoreVertical, Loader2, Signal, Shield, MessageSquare, Paperclip, Check, CheckCheck, Pin, Users, ImageIcon, FileText, Sparkles, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { format } from "date-fns";
import { SpringingLoader } from "@/components/dashboard/springing-loader";
import { AlertModal } from "@/components/ui/confirmation-modal";

function MessagesContent() {
    const supabase = createClient();
    const searchParams = useSearchParams();
    const targetUserId = searchParams.get('userId');

    const [me, setMe] = useState<any>(null);
    const [rooms, setRooms] = useState<any[]>([]);
    const [activeRoom, setActiveRoom] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [alertConfig, setAlertConfig] = useState<{ title: string, message: string, isOpen: boolean, variant?: "info" | "success" | "error" }>({ title: "", message: "", isOpen: false, variant: "info" });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setMe(user);
            const initialRooms = await fetchRooms();

            if (targetUserId) {
                const existing = initialRooms.find((r: any) => r.type === 'PRIVATE' && r.partner?.id === targetUserId);
                if (existing) {
                    setActiveRoom(existing);
                } else {
                    try {
                        const res = await fetch('/api/messages/rooms', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ targetUserId })
                        });
                        const data = await res.json();
                        if (data.room) {
                            await fetchRooms();
                            setActiveRoom(data.room);
                        }
                    } catch (e) {
                        console.error("Failed to start chat", e);
                    }
                }
            }
        };
        init();
    }, [targetUserId]);

    useEffect(() => {
        if (!me) return;

        const channel = supabase
            .channel('advanced-messaging')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'Message',
                },
                async (payload) => {
                    const msg = payload.new;
                    const inRoom = rooms.some(r => r.id === msg.chatRoomId);
                    if (inRoom) {
                        if (activeRoom?.id === msg.chatRoomId) {
                            setMessages(prev => [...prev.filter(m => m.id !== msg.id), msg]);
                            markAsRead(activeRoom.id);
                        }
                        fetchRooms();
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'ChatRoomMember',
                },
                (payload) => {
                    const member = payload.new;
                    if (activeRoom?.id === member.chatRoomId) {
                        setActiveRoom((prev: any) => {
                            if (!prev || prev.id !== member.chatRoomId) return prev;
                            return {
                                ...prev,
                                members: prev.members?.map((m: any) => m.userId === member.userId ? { ...m, ...member } : m)
                            };
                        });
                    }
                    setRooms(prev => prev.map(r => r.id === member.chatRoomId ? {
                        ...r,
                        members: r.members?.map((m: any) => m.userId === member.userId ? { ...m, ...member } : m)
                    } : r));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [me, activeRoom, rooms]);

    useEffect(() => {
        if (activeRoom) {
            fetchMessages(activeRoom.id);
            markAsRead(activeRoom.id);
        }
    }, [activeRoom]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchRooms = async () => {
        try {
            const res = await fetch('/api/messages/rooms');
            const data = await res.json();
            if (data.rooms) {
                setRooms(data.rooms);
                return data.rooms;
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingRooms(false);
        }
        return [];
    };

    const fetchMessages = async (chatRoomId: string) => {
        setLoadingMessages(true);
        try {
            const res = await fetch(`/api/messages?chatRoomId=${chatRoomId}`);
            const data = await res.json();
            if (data.messages) {
                setMessages(data.messages);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingMessages(false);
        }
    };

    const markAsRead = async (chatRoomId: string) => {
        try {
            await fetch('/api/messages/read', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatRoomId })
            });
            setRooms(prev => prev.map(r => r.id === chatRoomId ? { ...r, unreadCount: 0 } : r));
        } catch (e) {
            console.error(e);
        }
    };

    const handleSendMessage = async (e?: React.FormEvent, attachments?: any) => {
        if (e) e.preventDefault();
        if ((!newMessage.trim() && !attachments) || !activeRoom || !me) return;

        const content = newMessage;
        setNewMessage("");

        const tempId = 'temp-' + Date.now();
        const tempMsg = {
            id: tempId,
            content,
            attachments,
            createdAt: new Date().toISOString(),
            fromUserId: me.id,
            chatRoomId: activeRoom.id,
            fromUser: { name: me.user_metadata?.name || 'Me' },
            isOptimistic: true
        };
        setMessages(prev => [...prev, tempMsg]);

        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatRoomId: activeRoom.id,
                    content,
                    attachments
                })
            });

            if (!res.ok) {
                setMessages(prev => prev.filter(m => m.id !== tempId));
                setAlertConfig({
                    title: "Transmission Error",
                    message: "The neural signal could not be successfully relayed to the target node.",
                    isOpen: true,
                    variant: "error"
                });
            } else {
                // Remove temp message after successful post to avoid double display 
                // when the realtime message arrives (realtime will handle the display)
                setTimeout(() => {
                    setMessages(prev => prev.filter(m => m.id !== tempId));
                }, 500);
                fetchRooms();
            }
        } catch (e) {
            setMessages(prev => prev.filter(m => m.id !== tempId));
            setAlertConfig({
                title: "Core Link Down",
                message: "A critical failure occurred during neural data transmission.",
                isOpen: true,
                variant: "error"
            });
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeRoom) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('chatRoomId', activeRoom.id);

        try {
            const res = await fetch('/api/messages/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.url) {
                handleSendMessage(undefined, {
                    type: file.type.startsWith('image/') ? 'image' : 'file',
                    url: data.url,
                    name: data.name
                });
            } else {
                setAlertConfig({
                    title: "Buffer Overflow",
                    message: data.error || "The institutional storage node rejected the binary transmission.",
                    isOpen: true,
                    variant: "error"
                });
            }
        } catch (e) {
            setAlertConfig({
                title: "Encryption Protocol Fault",
                message: "Binary data could not be securely encapsulated for transmission.",
                isOpen: true,
                variant: "error"
            });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleModerate = async (messageId: string, type: 'pin' | 'delete', value?: boolean) => {
        try {
            const res = await fetch('/api/messages/moderate', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messageId,
                    isPinned: type === 'pin' ? value : undefined,
                    isDeleted: type === 'delete' ? true : undefined
                })
            });
            if (res.ok) {
                if (type === 'delete') {
                    setMessages(prev => prev.filter(m => m.id !== messageId));
                } else {
                    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isPinned: value } : m));
                }
            }
        } catch (e) {
            console.error("Moderation failed", e);
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        // Minimum length check depends on context, Code is usually longer
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            // If I am a student, search by code using lookup API
            const isStudent = me?.user_metadata?.role === 'STUDENT';
            const endpoint = isStudent
                ? `/api/students/lookup?code=${query}`
                : `/api/school/users/search?q=${query}`;

            const res = await fetch(endpoint);
            const data = await res.json();
            if (data.users) setSearchResults(data.users);
        } catch (e) {
            console.error(e);
        }
    };

    const startChat = async (user: any) => {
        setSearchQuery("");
        setSearchResults([]);

        try {
            const res = await fetch('/api/messages/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: user.id })
            });
            const data = await res.json();
            if (data.room) {
                await fetchRooms();
                setActiveRoom(data.room);
            } else {
                setAlertConfig({
                    title: "Link Authorization Denied",
                    message: data.error || "The target node is not accepting new neural connections.",
                    isOpen: true,
                    variant: "error"
                });
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-1000 relative max-w-full overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-eduGreen-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="mb-8 flex justify-between items-end relative z-10">
                <div>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-eduGreen-950/30 border border-eduGreen-500/20 text-[10px] font-black text-eduGreen-400 uppercase tracking-[0.3em] mb-4 backdrop-blur-md">
                        <Sparkles className="w-3 h-3 animate-pulse" />
                        <span>Institutional Neural Link</span>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                        Message <span className="text-eduGreen-500 not-italic">Hub</span>
                    </h1>
                </div>

                <div className="hidden md:flex flex-col items-end gap-1">
                    <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Network Status</div>
                    <div className="flex items-center gap-3 px-4 py-2 bg-zinc-950/50 border border-zinc-900 rounded-2xl backdrop-blur-xl">
                        <div className="w-2 h-2 rounded-full bg-eduGreen-500 animate-pulse shadow-[0_0_10px_rgba(20,122,82,0.6)]" />
                        <span className="text-[10px] font-black text-white uppercase tracking-tighter">Synchronized</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden bg-zinc-950/40 backdrop-blur-3xl border border-zinc-900/50 rounded-[2rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] relative z-10 w-full min-w-0">
                {/* Sidebar - Neural Identity Matrix */}
                <div className="w-72 border-r border-zinc-900/50 flex flex-col bg-zinc-950/20 relative shrink-0">
                    <div className="p-4 border-b border-zinc-900/50 bg-zinc-950/40">
                        <div className="relative group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-eduGreen-500 transition-all" />
                            <Input
                                placeholder={me?.user_metadata?.role === 'STUDENT' ? "Enter Student Code..." : "Search Identities..."}
                                className="pl-12 bg-zinc-900/40 border-zinc-800/50 h-14 rounded-[1.25rem] focus:border-eduGreen-600 focus:bg-zinc-900/80 transition-all font-bold text-xs placeholder:text-zinc-700"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                        <AnimatePresence mode="popLayout">
                            {searchQuery.length > 0 ? (
                                <motion.div
                                    key="search"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-2"
                                >
                                    <div className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] px-4 mb-4">Discovery Results</div>
                                    {searchResults.map(user => (
                                        <button
                                            key={user.id}
                                            onClick={() => startChat(user)}
                                            className="w-full flex items-center gap-4 p-4 rounded-[1.5rem] hover:bg-eduGreen-950/20 transition-all border border-transparent hover:border-eduGreen-900/20 text-left group"
                                        >
                                            <Avatar className="h-12 w-12 border-2 border-zinc-900 group-hover:border-eduGreen-500 transition-all shadow-xl">
                                                <AvatarFallback className="bg-zinc-950 text-eduGreen-500 font-black text-xs">
                                                    {(user.name && user.name[0]) || "?"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 overflow-hidden">
                                                <div className="font-black text-xs text-white uppercase tracking-tight truncate group-hover:text-eduGreen-400 transition-colors">{user.name}</div>
                                                <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">{user.role}</div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-zinc-800 group-hover:text-eduGreen-500 transition-all" />
                                        </button>
                                    ))}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="rooms"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-3"
                                >
                                    <div className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] px-4 mb-4">Active Neural Links</div>
                                    {loadingRooms ? (
                                        <div className="flex flex-col items-center justify-center py-20 opacity-40">
                                            <SpringingLoader message="Indexing Neural Matrix" />
                                        </div>
                                    ) : rooms.length === 0 && (
                                        <div className="text-center py-16 px-8 rounded-3xl bg-zinc-900/10 border border-zinc-900/50">
                                            <MessageSquare className="w-8 h-8 text-zinc-800 mx-auto mb-4 opacity-20" />
                                            <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest leading-relaxed">No active neural links established in local cloud</p>
                                        </div>
                                    )}
                                    {rooms.map((room) => {
                                        const lastMsg = room.messages?.[0];
                                        const isGroup = room.type === 'GROUP';
                                        const displayName = isGroup ? room.name : room.partner?.name || "Private Room";
                                        const displayAvatar = isGroup ? (room.name ? room.name[0] : "G") : (room.partner?.name?.[0] || "?");

                                        return (
                                            <button
                                                key={room.id}
                                                onClick={() => setActiveRoom(room)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 p-3 rounded-2xl transition-all border text-left group relative",
                                                    activeRoom?.id === room.id
                                                        ? "bg-eduGreen-600/10 border-eduGreen-900/40 shadow-[0_20px_40px_-15px_rgba(20,122,82,0.2)]"
                                                        : "bg-transparent border-transparent hover:bg-zinc-900/30 hover:border-zinc-800/40"
                                                )}
                                            >
                                                {activeRoom?.id === room.id && (
                                                    <motion.div
                                                        layoutId="activeRoom"
                                                        className="absolute inset-0 bg-gradient-to-r from-eduGreen-600/5 to-transparent rounded-2xl pointer-events-none"
                                                    />
                                                )}
                                                <div className="relative">
                                                    <Avatar className={cn(
                                                        "h-10 w-10 border transition-all shadow-xl overflow-hidden",
                                                        activeRoom?.id === room.id ? "border-eduGreen-500 scale-105" : "border-zinc-800",
                                                        isGroup ? "rounded-xl" : "rounded-full"
                                                    )}>
                                                        <AvatarFallback className={cn(
                                                            "bg-zinc-950 font-black text-lg",
                                                            isGroup ? "text-amber-500" : "text-eduGreen-500"
                                                        )}>
                                                            {displayAvatar}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    {!isGroup && (
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-eduGreen-500 rounded-full border-2 border-zinc-950 shadow-lg" />
                                                    )}
                                                </div>
                                                <div className="flex-1 overflow-hidden relative z-10">
                                                    <div className="flex justify-between items-center mb-1.5">
                                                        <span className="font-black text-xs text-white uppercase tracking-tight truncate pr-4">{displayName}</span>
                                                        {lastMsg && (
                                                            <span className="text-[9px] font-black text-zinc-700 uppercase tabular-nums">
                                                                {format(new Date(lastMsg.createdAt), 'HH:mm')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className={cn(
                                                        "text-[10px] font-bold truncate leading-none",
                                                        activeRoom?.id === room.id ? "text-eduGreen-400" : "text-zinc-600"
                                                    )}>
                                                        {lastMsg ? `${isGroup ? lastMsg.fromUser?.name + ': ' : ''}${lastMsg.content || (lastMsg.attachments ? 'Encrypted Payload' : '')}` : "Establish connection..."}
                                                    </p>
                                                </div>
                                                {room.unreadCount > 0 && (
                                                    <div className="absolute top-1/2 -translate-y-1/2 -right-1 bg-eduGreen-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-[0_0_15px_rgba(20,122,82,0.6)] animate-pulse">
                                                        {room.unreadCount}
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="flex-1 flex flex-col bg-zinc-950/20 relative min-w-0">
                    <AnimatePresence mode="wait">
                        {activeRoom ? (
                            <motion.div
                                key={activeRoom.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex-1 flex overflow-hidden min-w-0"
                            >
                                <div className="flex-1 flex flex-col min-w-0">
                                    <div className="h-16 px-6 border-b border-zinc-900/50 flex items-center justify-between bg-zinc-950/60 backdrop-blur-3xl relative z-20">
                                        <div className="flex items-center gap-5">
                                            <div className="relative">
                                                <Avatar className={cn(
                                                    "h-10 w-10 border shadow-[0_0_20px_rgba(33,201,141,0.2)]",
                                                    activeRoom.type === 'GROUP' ? "border-amber-500/50 rounded-xl" : "border-eduGreen-500/50"
                                                )}>
                                                    <AvatarFallback className="bg-zinc-950 text-white font-black text-sm">
                                                        {activeRoom.type === 'GROUP' ? (activeRoom.name ? activeRoom.name[0] : "G") : activeRoom.partner?.name?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className={cn(
                                                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-950",
                                                    activeRoom.type === 'GROUP' ? "bg-amber-500" : "bg-eduGreen-500 animate-pulse"
                                                )} />
                                            </div>
                                            <div>
                                                <div className="font-black text-sm text-white uppercase tracking-tight flex items-center gap-2">
                                                    {activeRoom.type === 'GROUP' ? activeRoom.name : activeRoom.partner?.name}
                                                    {activeRoom.type === 'PRIVATE' && <Shield className="w-3.5 h-3.5 text-eduGreen-600" />}
                                                </div>
                                                <div className="text-[10px] font-black text-zinc-500 flex items-center gap-2 uppercase tracking-[0.2em] mt-1">
                                                    {activeRoom.type === 'GROUP' ? (
                                                        <>
                                                            <Users className="w-3.5 h-3.5 text-amber-500/50" />
                                                            <span>{activeRoom._count?.members || activeRoom.members?.length || 0} Neural Nodes Active</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="text-eduGreen-500/80">Uplink Established</span>
                                                            <span className="text-zinc-800">•</span>
                                                            <span>Secured Session</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Button variant="ghost" size="sm" className="hidden lg:flex items-center gap-2 text-zinc-600 hover:text-white hover:bg-zinc-900 rounded-xl px-4 font-black text-[10px] uppercase tracking-widest">
                                                <Signal className="w-4 h-4" />
                                                Telemetry
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-zinc-600 hover:text-white hover:bg-zinc-900 rounded-xl w-11 h-11">
                                                <MoreVertical className="w-6 h-6" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Pinned Messages Bar */}
                                    {activeRoom.type === 'GROUP' && messages.some(m => m.isPinned) && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            className="px-10 py-4 bg-amber-500/5 border-b border-amber-500/20 flex items-center justify-between backdrop-blur-md"
                                        >
                                            <div className="flex items-center gap-4 overflow-hidden">
                                                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                                    <Pin className="w-4 h-4 text-amber-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[9px] font-black text-amber-500/70 uppercase tracking-widest mb-0.5">Anchored Protocol</div>
                                                    <div className="text-xs font-bold text-amber-100 truncate">
                                                        {messages.find(m => m.isPinned)?.content}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" className="h-8 text-[9px] font-black text-amber-500 uppercase tracking-widest hover:bg-amber-500/20 px-4 rounded-xl ml-4">
                                                Access
                                            </Button>
                                        </motion.div>
                                    )}

                                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar relative bg-black/10">
                                        {loadingMessages ? (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <SpringingLoader message="Synchronizing Downlink" />
                                            </div>
                                        ) : (
                                            <>
                                                {messages.map((msg, i) => {
                                                    const isSender = msg.fromUserId === me?.id;
                                                    const isNewDay = i === 0 || format(new Date(msg.createdAt), 'yyyy-MM-dd') !== format(new Date(messages[i - 1].createdAt), 'yyyy-MM-dd');

                                                    return (
                                                        <motion.div
                                                            key={msg.id || i}
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="space-y-6"
                                                        >
                                                            {isNewDay && (
                                                                <div className="flex justify-center my-10 relative">
                                                                    <div className="absolute inset-0 flex items-center">
                                                                        <div className="w-full border-t border-zinc-900/50" />
                                                                    </div>
                                                                    <div className="relative px-6 py-1.5 bg-zinc-950 border border-zinc-900 rounded-full text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em] leading-none backdrop-blur-xl">
                                                                        {format(new Date(msg.createdAt), 'MMMM dd, yyyy')}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div className={cn("flex flex-col", isSender ? "items-end" : "items-start")}>
                                                                <div className={cn("flex items-end gap-4 max-w-[80%]", isSender ? "flex-row-reverse text-right" : "flex-row text-left")}>
                                                                    {!isSender && (
                                                                        <Avatar className="h-10 w-10 border-2 border-zinc-900 shrink-0 shadow-2xl mb-1 mt-auto">
                                                                            <AvatarFallback className="text-xs bg-zinc-950 font-black text-eduGreen-500 uppercase">
                                                                                {msg.fromUser?.name?.[0] || "?"}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                    )}
                                                                    <div className="flex flex-col space-y-2">
                                                                        {!isSender && activeRoom.type === 'GROUP' && (
                                                                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-4 mb-1 opacity-90">
                                                                                {msg.fromUser?.name}
                                                                            </span>
                                                                        )}
                                                                        <div className={cn(
                                                                            "px-4 py-2.5 rounded-2xl text-[13px] font-medium shadow-xl transition-all relative group/msg overflow-hidden",
                                                                            isSender
                                                                                ? "bg-gradient-to-br from-eduGreen-600 to-emerald-950 text-white rounded-br-none border-t border-eduGreen-500/20"
                                                                                : "bg-zinc-900/80 text-zinc-200 rounded-bl-none border border-zinc-800 backdrop-blur-md"
                                                                        )}>
                                                                            {/* Message Ambient Glow */}
                                                                            {isSender && <div className="absolute inset-0 bg-eduGreen-500/5 blur-xl pointer-events-none" />}

                                                                            {msg.attachments && (
                                                                                <div className="mb-4 p-4 bg-black/40 rounded-3xl border border-white/5 backdrop-blur-xl overflow-hidden">
                                                                                    {msg.attachments.type === 'image' ? (
                                                                                        <img src={msg.attachments.url} alt="Attachment" className="max-w-full rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] border border-white/10" />
                                                                                    ) : (
                                                                                        <div className="flex items-center gap-4">
                                                                                            <div className="w-12 h-12 bg-zinc-950 rounded-2xl flex items-center justify-center border border-zinc-900 shadow-inner">
                                                                                                <FileText className="w-6 h-6 text-eduGreen-500" />
                                                                                            </div>
                                                                                            <div className="flex-1 overflow-hidden">
                                                                                                <div className="text-[11px] font-black truncate text-white uppercase tracking-tight">{msg.attachments.name}</div>
                                                                                                <div className="text-[9px] font-bold opacity-40 uppercase tracking-[0.2em] mt-1">Institutional Data File</div>
                                                                                            </div>
                                                                                            <a href={msg.attachments.url} target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5">
                                                                                                <Paperclip className="w-5 h-5 text-white" />
                                                                                            </a>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                            <p className="leading-relaxed whitespace-pre-wrap relative z-10">{msg.content}</p>
                                                                            {msg.isPinned && (
                                                                                <div className="absolute -top-1 -right-1 p-1 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                                                                                    <Pin className="w-3 h-3 text-black" fill="currentColor" />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className={cn(
                                                                            "flex items-center gap-2 mt-2 font-black uppercase tracking-[0.3em] opacity-40 text-[9px]",
                                                                            isSender ? "justify-end pr-2" : "pl-4"
                                                                        )}>
                                                                            {format(new Date(msg.createdAt), 'HH:mm')}
                                                                            {isSender && (
                                                                                <div className="flex items-center">
                                                                                    <CheckCheck className={cn(
                                                                                        "w-3.5 h-3.5 transition-all",
                                                                                        (activeRoom.type === 'PRIVATE' &&
                                                                                            activeRoom.members?.some((m: any) => m.userId !== me.id && new Date(m.lastReadAt || 0) >= new Date(msg.createdAt)))
                                                                                            ? "text-eduGreen-400 drop-shadow-[0_0_3px_rgba(52,211,153,0.5)]"
                                                                                            : "text-zinc-800"
                                                                                    )} />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                                <div ref={messagesEndRef} />
                                            </>
                                        )}
                                    </div>

                                    <div className="p-4 bg-zinc-950/40 border-t border-zinc-900/50 backdrop-blur-3xl relative z-20">
                                        <form onSubmit={(e) => handleSendMessage(e)} className="flex items-end gap-3 p-2 bg-zinc-900/30 rounded-2xl border border-zinc-800/50 focus-within:border-eduGreen-900/50 focus-within:bg-zinc-900/50 transition-all relative">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileUpload}
                                                className="hidden"
                                            />
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploading}
                                                className="rounded-xl text-zinc-600 hover:text-eduGreen-500 hover:bg-eduGreen-500/10 w-10 h-10 transition-all mb-1 shrink-0"
                                            >
                                                {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-eduGreen-500" /> : <Paperclip className="w-5 h-5" />}
                                            </Button>
                                            <textarea
                                                className="flex-1 bg-transparent border-0 focus:ring-0 text-white placeholder:text-zinc-700 font-bold px-2 py-3 min-h-[44px] max-h-32 scrollbar-hide resize-none text-[14px] leading-snug"
                                                placeholder="Transmit packet..."
                                                rows={1}
                                                value={newMessage}
                                                onChange={e => {
                                                    setNewMessage(e.target.value);
                                                    e.target.style.height = 'auto';
                                                    e.target.style.height = e.target.scrollHeight + 'px';
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSendMessage();
                                                    }
                                                }}
                                            />
                                            <div className="flex items-center gap-2 pr-1 mb-1">
                                                <Button
                                                    type="submit"
                                                    size="icon"
                                                    disabled={(!newMessage.trim() && !isUploading)}
                                                    className="rounded-xl bg-eduGreen-600 hover:bg-eduGreen-500 text-white shadow-lg w-10 h-10 transition-all active:scale-95 disabled:opacity-20 shrink-0"
                                                >
                                                    <Send className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </form>
                                    </div>
                                </div>

                                {/* Right Profile Panel - Neural Identity Matrix */}
                                <div className="w-64 border-l border-zinc-900/50 bg-zinc-950/40 backdrop-blur-3xl overflow-y-auto hidden 2xl:flex flex-col p-6 relative shrink-0">
                                    <div className="absolute inset-0 bg-gradient-to-b from-eduGreen-500/5 to-transparent pointer-events-none" />

                                    <div className="text-center mb-8 relative z-10">
                                        <div className="relative inline-block mx-auto mb-6">
                                            <Avatar className={cn(
                                                "h-24 w-24 border-2 transition-all shadow-2xl",
                                                activeRoom.type === 'GROUP' ? "border-amber-500/20 rounded-2xl" : "border-eduGreen-500/20"
                                            )}>
                                                <AvatarFallback className="bg-zinc-950 text-2xl font-black text-white italic uppercase tracking-tighter">
                                                    {activeRoom.type === 'GROUP' ? (activeRoom.name ? activeRoom.name[0] : "G") : activeRoom.partner?.name?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className={cn(
                                                "absolute -bottom-1 right-1 w-6 h-6 rounded-lg border-2 border-zinc-950 flex items-center justify-center shadow-lg",
                                                activeRoom.type === 'GROUP' ? "bg-amber-500" : "bg-eduGreen-500"
                                            )}>
                                                {activeRoom.type === 'GROUP' ? <Users className="w-3 h-3 text-black" /> : <Shield className="w-3 h-3 text-black" />}
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2 leading-none italic">
                                            {activeRoom.type === 'GROUP' ? activeRoom.name : activeRoom.partner?.name}
                                        </h3>
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-zinc-900/50 border border-zinc-800 shadow-md backdrop-blur-md">
                                            <div className={cn("w-1.5 h-1.5 rounded-full", activeRoom.type === 'GROUP' ? "bg-amber-500" : "bg-eduGreen-500")} />
                                            <span className="text-[8px] font-black text-white uppercase tracking-widest">
                                                {activeRoom.type === 'GROUP' ? "Collab Node" : activeRoom.partner?.role + " Node"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-6 relative z-10">
                                        <div className="p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800/50">
                                            <div className="flex items-center gap-2 mb-2">
                                                <User className="w-3.5 h-3.5 text-zinc-500" />
                                                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Identity</p>
                                            </div>
                                            <p className="text-[10px] font-bold text-zinc-400 leading-relaxed italic">
                                                {activeRoom.partner?.bio || (activeRoom.type === 'GROUP' ? "Unified institutional communication link for cross-node sync." : "Identity bio not established.")}
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 px-1 mb-1">
                                                <Signal className="w-3.5 h-3.5 text-zinc-500" />
                                                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Telemetry</p>
                                            </div>
                                            <div className="p-4 bg-zinc-900/20 rounded-xl border border-zinc-800/50 flex flex-col gap-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[8px] font-black text-zinc-600 uppercase">Link</span>
                                                    <span className="text-[8px] font-black text-eduGreen-500 italic">STABLE</span>
                                                </div>
                                                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: '94%' }} className="h-full bg-eduGreen-500" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <Button variant="outline" className="w-full h-10 rounded-xl border-zinc-800 text-zinc-500 hover:text-white font-black text-[8px] uppercase tracking-widest bg-transparent">
                                                Declassify
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex-1 flex flex-col items-center justify-center p-12 text-center relative overflow-hidden"
                            >
                                {/* Background Patterns */}
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #3BD68D 1px, transparent 0)', backgroundSize: '40px 40px' }} />

                                <div className="relative group cursor-default mb-12">
                                    <div className="absolute inset-0 bg-eduGreen-500/20 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-1000" />
                                    <div className="w-48 h-48 bg-zinc-950 rounded-[4rem] border-2 border-zinc-900 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] flex items-center justify-center relative z-10 group-hover:border-eduGreen-500/30 transition-all duration-700">
                                        <div className="w-32 h-32 bg-eduGreen-500/5 rounded-full flex items-center justify-center animate-pulse">
                                            <MessageSquare className="w-16 h-16 text-zinc-800 group-hover:text-eduGreen-500 transition-colors" />
                                        </div>
                                    </div>
                                </div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="max-w-md relative z-10"
                                >
                                    <h3 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 italic">Neural Hub <span className="text-eduGreen-500">Standby</span></h3>
                                    <p className="text-[11px] font-black text-zinc-700 uppercase tracking-[0.4em] leading-relaxed mb-12">Select a secure identity node from the matrix to initiate high-bandwidth institutional uplink.</p>

                                    {me && (
                                        <div className="p-8 bg-zinc-900/20 border border-zinc-900/50 rounded-[3rem] backdrop-blur-3xl flex items-center gap-8 shadow-2xl">
                                            <Avatar className="h-20 w-20 border-2 border-eduGreen-500/30 shadow-2xl">
                                                <AvatarFallback className="bg-zinc-950 text-2xl font-black text-eduGreen-500 uppercase">
                                                    {me.user_metadata?.name?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="text-left">
                                                <div className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em] mb-2 px-1">Active Identity</div>
                                                <div className="text-xl font-black text-white uppercase tracking-tight italic">{me.user_metadata?.name}</div>
                                                <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-eduGreen-500/10 border border-eduGreen-500/20 text-[9px] font-black text-eduGreen-500 uppercase tracking-widest">
                                                    {me.user_metadata?.role} NODE
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <AlertModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
                variant={alertConfig.variant}
            />
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
                <SpringingLoader message="Synchronizing Neural Identity Matrix" />
            </div>
        }>
            <MessagesContent />
        </Suspense>
    );
}
