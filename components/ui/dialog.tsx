"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const DialogContext = React.createContext<any>(null);

export function Dialog({ children, open, onOpenChange }: any) {
    const [isOpen, setIsOpen] = React.useState(open || false);

    React.useEffect(() => {
        if (open !== undefined) setIsOpen(open);
    }, [open]);

    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleOpenChange = (val: boolean) => {
        setIsOpen(val);
        if (onOpenChange) onOpenChange(val);
    };

    return (
        <DialogContext.Provider value={{ isOpen, setIsOpen: handleOpenChange }}>
            {children}
        </DialogContext.Provider>
    );
}

export function DialogTrigger({ children, asChild }: any) {
    const { setIsOpen } = React.useContext(DialogContext);
    return (
        <div onClick={() => setIsOpen(true)} className="inline-block cursor-pointer">
            {children}
        </div>
    );
}

export function DialogContent({ children, className }: any) {
    const { isOpen, setIsOpen } = React.useContext(DialogContext);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen || !mounted) return null;

    const modalContent = (
        <div
            className="fixed inset-0 z-[99999]"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem'
            }}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/85 backdrop-blur-xl"
                onClick={() => setIsOpen(false)}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />

            {/* Modal Box - Centered */}
            <div
                className={cn(
                    "relative w-full max-w-md mx-auto",
                    "bg-zinc-950 backdrop-blur-2xl",
                    "border border-zinc-800/80",
                    "rounded-[2rem] shadow-2xl",
                    "p-8",
                    "animate-in fade-in-0 zoom-in-95 duration-300",
                    className
                )}
                style={{
                    position: 'relative',
                    zIndex: 100000,
                    margin: 'auto'
                }}
            >
                {/* Top Glow */}
                <div className="absolute -inset-px bg-gradient-to-b from-zinc-700/30 via-transparent to-transparent rounded-[2rem] pointer-events-none" />

                {/* Content */}
                <div className="relative z-10">
                    {children}
                </div>

                {/* Close Button */}
                <button
                    className="absolute right-5 top-5 w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 hover:border-zinc-600 transition-all duration-200 group z-20"
                    onClick={() => setIsOpen(false)}
                >
                    <X className="h-4 w-4 transition-transform group-hover:rotate-90 duration-200" />
                    <span className="sr-only">Close</span>
                </button>
            </div>
        </div>
    );

    // Render to body root using portal for guaranteed centering
    return createPortal(modalContent, document.body);
}

export function DialogHeader({ children, className }: any) {
    return (
        <div className={cn("flex flex-col items-center text-center mb-6", className)}>
            {children}
        </div>
    );
}

export function DialogTitle({ children, className }: any) {
    return (
        <h3 className={cn("text-2xl font-black tracking-tight text-white", className)}>
            {children}
        </h3>
    );
}

export function DialogDescription({ children, className }: any) {
    return (
        <p className={cn("text-sm text-zinc-500 font-medium mt-2 leading-relaxed", className)}>
            {children}
        </p>
    );
}

export function DialogClose({ children, asChild }: any) {
    const { setIsOpen } = React.useContext(DialogContext);
    return (
        <div onClick={() => setIsOpen(false)} className="inline-block cursor-pointer">
            {children}
        </div>
    );
}

export function DialogFooter({ children, className }: any) {
    return (
        <div className={cn("flex flex-col sm:flex-row gap-3 mt-6", className)}>
            {children}
        </div>
    );
}
