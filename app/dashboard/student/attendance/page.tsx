"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, AlertCircle, Calendar } from "lucide-react";

export default function StudentAttendancePage() {
    const [records, setRecords] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/student/attendance');
            const data = await res.json();
            if (data.records) {
                setRecords(data.records);
                setStats(data.stats);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading attendance...</div>;

    return (
        <div className="space-y-6 animate-in fade-in">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Attendance Record</h2>
                <p className="text-gray-500 dark:text-gray-400">Your presence in class.</p>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Attendance Rate" value={stats.percentage.toFixed(1) + "%"} color="text-eduGreen-600" />
                    <StatCard label="Present" value={stats.present} color="text-green-600" />
                    <StatCard label="Late" value={stats.late} color="text-orange-500" />
                    <StatCard label="Absent" value={stats.absent} color="text-red-500" />
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" /> Recent History
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {records.map((record) => (
                            <div key={record.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-900">
                                <div>
                                    <div className="font-medium text-gray-900 dark:text-gray-200">
                                        {new Date(record.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {record.class?.name || "Class"}
                                    </div>
                                </div>
                                <div className={`flex items-center gap-2 font-bold px-3 py-1 rounded-full text-xs ${record.status === 'PRESENT' ? 'bg-green-100 text-green-700' :
                                    record.status === 'ABSENT' ? 'bg-red-100 text-red-700' :
                                        record.status === 'LATE' ? 'bg-orange-100 text-orange-700' :
                                            'bg-blue-100 text-blue-700'
                                    }`}>
                                    {record.status === 'PRESENT' && <CheckCircle className="w-3 h-3" />}
                                    {record.status === 'ABSENT' && <XCircle className="w-3 h-3" />}
                                    {record.status === 'LATE' && <Clock className="w-3 h-3" />}
                                    {record.status === 'EXCUSED' && <AlertCircle className="w-3 h-3" />}
                                    {record.status}
                                </div>
                            </div>
                        ))}
                        {records.length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                                No attendance records found.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StatCard({ label, value, color }: any) {
    return (
        <Card>
            <CardContent className="p-6 text-center">
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">{label}</div>
            </CardContent>
        </Card>
    );
}
