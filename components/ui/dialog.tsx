"use client";

import * as React from "react";
import { X } from "lucide-react";

// Simplified Dialog
const DialogContext = React.createContext<any>(null);

export function Dialog({ children, open, onOpenChange }: any) {
    const [isOpen, setIsOpen] = React.useState(open || false);

    React.useEffect(() => {
        if (open !== undefined) setIsOpen(open);
    }, [open]);

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
        <div onClick={() => setIsOpen(true)} className="inline-block">
            {children}
        </div>
    );
}

export function DialogContent({ children, className }: any) {
    const { isOpen, setIsOpen } = React.useContext(DialogContext);
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
                onClick={() => setIsOpen(false)}
            />
            {/* Content */}
            <div className={`fixed z-50 grid w-full max-w-lg scale-100 gap-4 border bg-white dark:bg-zinc-900 p-6 opacity-100 shadow-lg duration-200 animate-in fade-in-0 zoom-in-95 sm:rounded-lg ${className}`}>
                {children}
                <button
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                    onClick={() => setIsOpen(false)}
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </button>
            </div>
        </div>
    );
}

export function DialogHeader({ children, className }: any) {
    return (
        <div className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}>
            {children}
        </div>
    );
}

export function DialogTitle({ children, className }: any) {
    return (
        <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
            {children}
        </h3>
    );
}
