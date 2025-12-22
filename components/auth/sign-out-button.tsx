"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useState, useRef } from "react";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";

interface SignOutButtonProps {
    className?: string;
    variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
    fullWidth?: boolean;
}

export function SignOutButton({ className, variant = "ghost", fullWidth = true }: SignOutButtonProps) {
    const [showConfirm, setShowConfirm] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const handleConfirm = () => {
        if (formRef.current) {
            formRef.current.submit();
        }
    };

    return (
        <>
            <form ref={formRef} action="/auth/signout" method="post" className={fullWidth ? "w-full" : "inline-block"}>
                <Button
                    type="button"
                    onClick={() => setShowConfirm(true)}
                    variant={variant}
                    className={`gap-3 ${variant === 'ghost' ? 'text-red-500 hover:text-red-400 hover:bg-red-900/20' : ''} ${fullWidth ? "w-full justify-start" : ""} ${className}`}
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </Button>
            </form>

            <ConfirmationModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleConfirm}
                title="Terminate Session"
                description="Are you sure you want to log out of the LUCY tactical environment? You will need to re-authenticate to gain access."
                confirmText="Terminate"
                variant="logout"
            />
        </>
    );
}
