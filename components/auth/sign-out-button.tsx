import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface SignOutButtonProps {
    className?: string;
    variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
    fullWidth?: boolean;
}

export function SignOutButton({ className, variant = "ghost", fullWidth = true }: SignOutButtonProps) {
    return (
        <form action="/auth/signout" method="post" className={fullWidth ? "w-full" : "inline-block"}>
            <Button
                variant={variant}
                className={`gap-3 ${variant === 'ghost' ? 'text-red-500 hover:text-red-400 hover:bg-red-900/20' : ''} ${fullWidth ? "w-full justify-start" : ""} ${className}`}
            >
                <LogOut className="w-5 h-5" />
                Sign Out
            </Button>
        </form>
    );
}
