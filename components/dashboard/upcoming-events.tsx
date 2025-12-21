"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function UpcomingEventsWidget() {
    const [events, setEvents] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/school/events')
            .then(res => res.json())
            .then(data => {
                if (data.events) {
                    // Filter future events and take top 3
                    const future = data.events
                        .filter((e: any) => new Date(e.eventDate) >= new Date())
                        .slice(0, 3);
                    setEvents(future);
                }
            })
            .catch(err => console.error(err));
    }, []);

    if (events.length === 0) return (
        <Card className="border-gray-100 dark:border-zinc-800 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="w-5 h-5 text-gray-500" /> Upcoming Events
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-center py-8 text-gray-400 text-sm">
                    No upcoming events scheduled.
                </div>
            </CardContent>
        </Card>
    );

    return (
        <Card className="border-gray-100 dark:border-zinc-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="w-5 h-5 text-eduGreen-600" /> Upcoming Events
                </CardTitle>
                <Link href="/dashboard/events">
                    <Button variant="ghost" size="sm" className="h-8 text-xs">View All</Button>
                </Link>
            </CardHeader>
            <CardContent className="space-y-4">
                {events.map((event) => (
                    <div key={event.id} className="flex gap-3 items-start pb-3 border-b last:border-0 last:pb-0 border-gray-100 dark:border-zinc-800">
                        <div className="flex flex-col items-center bg-gray-100 dark:bg-zinc-800 rounded-md p-2 min-w-[3.5rem]">
                            <span className="text-xs font-bold text-gray-500 uppercase">{new Date(event.eventDate).toLocaleDateString('en-US', { month: 'short' })}</span>
                            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{new Date(event.eventDate).getDate()}</span>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm line-clamp-1" title={event.title}>{event.title}</h4>
                            <p className="text-xs text-gray-500 mb-1 line-clamp-1">{event.description}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                {new Date(event.eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
