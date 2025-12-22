"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Send, User, MoreVertical, Loader2, Signal, Shield, MessageSquare, Paperclip, Check, CheckCheck, Pin, Users, ImageIcon, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
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
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            const res = await fetch(`/api/school/users/search?q=${query}`);
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
        <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-700">
            <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-eduGreen-950/20 border border-eduGreen-900/30 text-[10px] font-black text-eduGreen-500 uppercase tracking-widest mb-3">
                    <Signal className="w-3 h-3" />
                    <span>Secure Neural Link</span>
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight">Messaging Hub</h1>
            </div>

            <Card className="flex-1 flex overflow-hidden bg-zinc-950/50 backdrop-blur-2xl border-zinc-900 rounded-[2.5rem] shadow-2xl border-t-zinc-800/20">
                <div className="w-80 border-r border-zinc-900 flex flex-col bg-zinc-950/30">
                    <div className="p-6 border-b border-zinc-900">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-eduGreen-500 transition-colors" />
                            <Input
                                placeholder="Search identity..."
                                className="pl-11 bg-zinc-900/50 border-zinc-800 h-12 rounded-2xl focus:border-eduGreen-600 transition-all font-bold text-xs"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {searchQuery.length > 0 ? (
                            <div className="p-4 space-y-2">
                                <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-2 mb-2">Neural Nodes</div>
                                {searchResults.map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => startChat(user)}
                                        className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-eduGreen-950/20 transition-all border border-transparent hover:border-eduGreen-900/30 text-left group"
                                    >
                                        <Avatar className="h-10 w-10 border-2 border-zinc-800 group-hover:border-eduGreen-500 transition-all">
                                            <AvatarFallback className="bg-zinc-950 text-eduGreen-500 font-black text-xs">
                                                {(user.name && user.name[0]) || "?"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 overflow-hidden">
                                            <div className="font-black text-xs text-white uppercase tracking-tight truncate">{user.name}</div>
                                            <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{user.role}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 space-y-2">
                                {loadingRooms ? (
                                    <div className="flex flex-col items-center justify-center py-20 opacity-60 scale-75">
                                        <SpringingLoader message="Discovering Neural Links" />
                                    </div>
                                ) : rooms.length === 0 && (
                                    <div className="text-center py-12 px-6">
                                        <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em]">No active neural links discovered</p>
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
                                                "w-full flex items-center gap-4 p-4 rounded-2xl transition-all border text-left group relative",
                                                activeRoom?.id === room.id
                                                    ? "bg-eduGreen-600/10 border-eduGreen-900/50 shadow-lg shadow-eduGreen-950/20"
                                                    : "bg-transparent border-transparent hover:bg-zinc-900/30 hover:border-zinc-800/50"
                                            )}
                                        >
                                            <div className="relative">
                                                <Avatar className={cn(
                                                    "h-12 w-12 border-2 transition-all shadow-xl",
                                                    activeRoom?.id === room.id ? "border-eduGreen-500" : "border-zinc-800",
                                                    isGroup && "rounded-[1rem]"
                                                )}>
                                                    <AvatarFallback className={cn(
                                                        "bg-zinc-950 font-black",
                                                        isGroup ? "text-amber-500" : "text-eduGreen-500"
                                                    )}>
                                                        {displayAvatar}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {!isGroup && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-eduGreen-500 rounded-full border-2 border-zinc-950 shadow-sm" />}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-black text-[11px] text-white uppercase tracking-tight truncate">{displayName}</span>
                                                    {lastMsg && (
                                                        <span className="text-[8px] font-black text-zinc-700 uppercase">
                                                            {format(new Date(lastMsg.createdAt), 'HH:mm')}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={cn(
                                                    "text-[10px] font-bold truncate leading-none",
                                                    activeRoom?.id === room.id ? "text-eduGreen-400" : "text-zinc-600"
                                                )}>
                                                    {lastMsg ? `${isGroup ? lastMsg.fromUser?.name + ': ' : ''}${lastMsg.content || (lastMsg.attachments ? 'Attached file' : '')}` : "Establish uplink..."}
                                                </p>
                                            </div>
                                            {room.unreadCount > 0 && (
                                                <div className="absolute top-4 right-4 bg-eduGreen-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-[0_0_10px_rgba(20,122,82,0.4)] animate-pulse">
                                                    {room.unreadCount}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col bg-zinc-950/20">
                    {activeRoom ? (
                        <div className="flex-1 flex overflow-hidden">
                            <div className="flex-1 flex flex-col">
                                <div className="h-20 px-8 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/30 backdrop-blur-md">
                                    <div className="flex items-center gap-4">
                                        <Avatar className={cn("h-10 w-10 border-2", activeRoom.type === 'GROUP' ? "border-amber-500/50 rounded-xl" : "border-eduGreen-500/50")}>
                                            <AvatarFallback className="bg-zinc-950 text-white font-black">
                                                {activeRoom.type === 'GROUP' ? (activeRoom.name ? activeRoom.name[0] : "G") : activeRoom.partner?.name?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-black text-sm text-white uppercase tracking-tight">
                                                {activeRoom.type === 'GROUP' ? activeRoom.name : activeRoom.partner?.name}
                                            </div>
                                            <div className="text-[9px] font-black text-zinc-600 flex items-center gap-1.5 uppercase tracking-widest mt-0.5">
                                                {activeRoom.type === 'GROUP' ? (
                                                    <>
                                                        <Users className="w-3 h-3 text-amber-500" />
                                                        <span>{activeRoom._count?.members || activeRoom.members?.length || 0} Neural Nodes Connected</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-eduGreen-500 animate-pulse shadow-[0_0_8px_rgba(33,201,141,0.5)]" />
                                                        <span>Active Neural Link</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" className="text-zinc-700 hover:text-white hover:bg-zinc-900 rounded-xl">
                                            <MoreVertical className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Pinned Messages Bar */}
                                {activeRoom.type === 'GROUP' && messages.some(m => m.isPinned) && (
                                    <div className="px-8 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <Pin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                            <div className="text-[10px] font-black text-amber-200 uppercase tracking-tight truncate">
                                                Pinned: {messages.find(m => m.isPinned)?.content}
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="h-6 text-[8px] font-black text-amber-500 uppercase tracking-widest hover:bg-amber-500/20 px-2 rounded-lg">
                                            View
                                        </Button>
                                    </div>
                                )}

                                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar relative">
                                    {loadingMessages ? (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <SpringingLoader message="Establishing Neural Downlink" />
                                        </div>
                                    ) : (
                                        <>
                                            {messages.map((msg, i) => {
                                                const isSender = msg.fromUserId === me?.id;
                                                const isNewDay = i === 0 || format(new Date(msg.createdAt), 'yyyy-MM-dd') !== format(new Date(messages[i - 1].createdAt), 'yyyy-MM-dd');

                                                return (
                                                    <div key={msg.id || i} className="space-y-4">
                                                        {isNewDay && (
                                                            <div className="flex justify-center my-6">
                                                                <div className="px-4 py-1 bg-zinc-900/50 border border-zinc-800 rounded-full text-[8px] font-black text-zinc-700 uppercase tracking-widest leading-none">
                                                                    {format(new Date(msg.createdAt), 'MMMM dd, yyyy')}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className={cn("flex flex-col", isSender ? "items-end" : "items-start")}>
                                                            <div className="flex items-end gap-3 max-w-[85%]">
                                                                {!isSender && (
                                                                    <Avatar className="h-8 w-8 border border-zinc-900 shrink-0 shadow-lg mb-1">
                                                                        <AvatarFallback className="text-[10px] bg-zinc-950 font-black text-eduGreen-500">
                                                                            {msg.fromUser?.name?.[0] || "?"}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                )}
                                                                <div className={cn(
                                                                    "px-6 py-4 rounded-[2rem] text-[13px] font-bold shadow-2xl transition-all relative group/msg",
                                                                    isSender
                                                                        ? "bg-eduGreen-600 text-white rounded-br-none shadow-eduGreen-950/20 border-t border-eduGreen-500/30"
                                                                        : "bg-zinc-950 text-zinc-100 rounded-bl-none border border-zinc-900"
                                                                )}>
                                                                    {/* User Name in Group */}
                                                                    {!isSender && activeRoom.type === 'GROUP' && (
                                                                        <div className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1.5 opacity-80">
                                                                            {msg.fromUser?.name}
                                                                        </div>
                                                                    )}
                                                                    {msg.attachments && (
                                                                        <div className="mb-3 p-3 bg-black/40 rounded-2xl border border-white/5">
                                                                            {msg.attachments.type === 'image' ? (
                                                                                <img src={msg.attachments.url} alt="Attachment" className="max-w-full rounded-xl shadow-2xl" />
                                                                            ) : (
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center border border-zinc-900">
                                                                                        <FileText className="w-5 h-5 text-eduGreen-500" />
                                                                                    </div>
                                                                                    <div className="flex-1 overflow-hidden">
                                                                                        <div className="text-[10px] font-black truncate">{msg.attachments.name}</div>
                                                                                        <div className="text-[8px] font-bold opacity-50 uppercase tracking-widest">Encrypted Data</div>
                                                                                    </div>
                                                                                    <a href={msg.attachments.url} target="_blank" rel="noreferrer" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                                                                        <Paperclip className="w-4 h-4 text-white" />
                                                                                    </a>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                                    {msg.isPinned && (
                                                                        <Pin className="absolute -top-2 -right-2 w-4 h-4 text-amber-500 fill-amber-500" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className={cn("flex items-center gap-2 mt-2 font-black uppercase tracking-[0.2em] opacity-30 text-[8px]", isSender ? "mr-1" : "ml-12")}>
                                                                {format(new Date(msg.createdAt), 'HH:mm')}
                                                                {isSender && (
                                                                    <CheckCheck className={cn(
                                                                        "w-3 h-3 transition-colors",
                                                                        (activeRoom.type === 'PRIVATE' &&
                                                                            activeRoom.members?.some((m: any) => m.userId !== me.id && new Date(m.lastReadAt || 0) >= new Date(msg.createdAt)))
                                                                            ? "text-eduGreen-500"
                                                                            : "text-zinc-700"
                                                                    )} />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div ref={messagesEndRef} />
                                        </>
                                    )}
                                </div>

                                <div className="p-6 bg-zinc-950/30 border-t border-zinc-900">
                                    <form onSubmit={(e) => handleSendMessage(e)} className="flex gap-4 p-2 bg-zinc-900/40 rounded-[2.5rem] border border-zinc-800/50 focus-within:border-eduGreen-900/50 transition-all shadow-inner relative">
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
                                            className="rounded-2xl text-zinc-600 hover:text-eduGreen-500 w-12 h-12 transition-all mt-auto mb-auto ml-2"
                                        >
                                            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                                        </Button>
                                        <textarea
                                            className="flex-1 bg-transparent border-0 focus:ring-0 text-white placeholder:text-zinc-700 font-bold px-4 py-4 min-h-[48px] max-h-32 scrollbar-hide resize-none text-[13px]"
                                            placeholder="Transmit neural data..."
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
                                        <Button
                                            type="submit"
                                            size="icon"
                                            disabled={(!newMessage.trim() && !isUploading)}
                                            className="rounded-2xl bg-eduGreen-600 hover:bg-eduGreen-500 text-white shadow-lg shadow-eduGreen-900/20 w-12 h-12 transition-all active:scale-90 disabled:opacity-50 disabled:bg-zinc-800 disabled:shadow-none mt-auto mb-auto mr-2"
                                        >
                                            <Send className="w-5 h-5 ml-0.5" />
                                        </Button>
                                    </form>
                                </div>
                            </div>

                            {/* Right Profile Panel */}
                            <div className="w-72 border-l border-zinc-900 bg-zinc-950/40 overflow-y-auto hidden xl:flex flex-col p-8">
                                <div className="text-center mb-8">
                                    <Avatar className={cn("h-24 w-24 border-4 mx-auto mb-6 shadow-2xl transition-all", activeRoom.type === 'GROUP' ? "border-amber-500/30 rounded-[2rem]" : "border-eduGreen-500/30")}>
                                        <AvatarFallback className="bg-zinc-950 text-2xl font-black text-white">
                                            {activeRoom.type === 'GROUP' ? (activeRoom.name ? activeRoom.name[0] : "G") : activeRoom.partner?.name?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">
                                        {activeRoom.type === 'GROUP' ? activeRoom.name : activeRoom.partner?.name}
                                    </h3>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                                        {activeRoom.type === 'GROUP' ? "Collaborative Cluster" : activeRoom.partner?.role || "Neural Node"}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800">
                                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-3">Bio / Identity</p>
                                        <p className="text-xs font-bold text-zinc-400 leading-relaxed">
                                            {activeRoom.partner?.bio || (activeRoom.type === 'GROUP' ? "Unified communication channel for school-wide synchronization." : "No identity bio established in the network.")}
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">Network Status</p>
                                        <div className="flex items-center justify-between p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800">
                                            <span className="text-[10px] font-bold text-zinc-500">Connection</span>
                                            <span className="flex items-center gap-2 text-[10px] font-black text-eduGreen-500">
                                                <div className="w-1.5 h-1.5 rounded-full bg-eduGreen-500 shadow-[0_0_8px_rgba(33,201,141,0.5)]" />
                                                STABLE
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800">
                                            <span className="text-[10px] font-bold text-zinc-500">Encryption</span>
                                            <span className="text-[10px] font-black text-zinc-400">AES-256</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-32 h-32 bg-zinc-950 rounded-[3rem] border-2 border-zinc-900 shadow-2xl flex items-center justify-center mb-10 group hover:border-eduGreen-500/50 transition-all duration-700">
                                <Avatar className="w-24 h-24 border-0">
                                    <AvatarFallback className="bg-transparent text-4xl text-zinc-800 group-hover:text-eduGreen-500 transition-colors">
                                        {me?.user_metadata?.name?.[0] || <MessageSquare className="w-10 h-10" />}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-3">Neural Interface Standby</h3>
                            <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] max-w-sm leading-relaxed">Select a secure node from the identity matrix to initiate high-bandwidth neural downlink.</p>

                            {me && (
                                <div className="mt-12 p-6 bg-zinc-900/20 border border-zinc-900 rounded-[2rem] flex items-center gap-6 max-w-md w-full">
                                    <Avatar className="h-16 w-16 border-2 border-eduGreen-500/30">
                                        <AvatarFallback className="bg-zinc-950 text-xl font-black text-eduGreen-500">
                                            {me.user_metadata?.name?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="text-left">
                                        <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Your Identity</div>
                                        <div className="text-lg font-black text-white uppercase tracking-tight">{me.user_metadata?.name}</div>
                                        <div className="text-[10px] font-bold text-eduGreen-500 uppercase tracking-widest">{me.user_metadata?.role}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Card>

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
