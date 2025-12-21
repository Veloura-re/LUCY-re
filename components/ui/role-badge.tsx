import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoleBadgeProps {
    role: "SUPERADMIN" | "PRINCIPAL" | "TEACHER" | "HOMEROOM" | "PARENT" | "STUDENT";
    className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
    const config = {
        SUPERADMIN: { label: "Super Admin", color: "bg-purple-950/30 text-purple-400 border-purple-800/50" },
        PRINCIPAL: { label: "Director", color: "bg-eduGreen-950/30 text-eduGreen-400 border-eduGreen-800/50" },
        TEACHER: { label: "Teacher", color: "bg-sky-950/30 text-sky-400 border-sky-800/50" },
        HOMEROOM: { label: "Homeroom", color: "bg-orange-950/30 text-orange-400 border-orange-800/50" },
        PARENT: { label: "Parent", color: "bg-zinc-900/50 text-zinc-400 border-zinc-800" },
        STUDENT: { label: "Student", color: "bg-blue-950/30 text-blue-400 border-blue-800/50" },
    };

    const { label, color } = config[role] || { label: role, color: "bg-gray-100 text-gray-700" };

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-chip text-xs font-medium border",
                color,
                className
            )}
        >
            {label}
            <BadgeCheck className="w-3.5 h-3.5" />
        </span>
    );
}
