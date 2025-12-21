"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

// Simplified Select Component matching Shadcn API
// Using native select for MVP logic if complex custom dropdown is too heavy, 
// BUT my code expects Composable parts. I'll make a mocked composable version.

// Context to share state
// Simplified Select Component matching Shadcn API
// Using custom implementation to ensure it works in this environment

const SelectContext = React.createContext<any>(null);

export function Select({ children, onValueChange, value, disabled }: any) {
    const [open, setOpen] = React.useState(false);
    const [selectedValue, setSelectedValue] = React.useState(value);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Sync with external value
    React.useEffect(() => {
        setSelectedValue(value);
    }, [value]);

    // Handle clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [open]);

    const handleSelect = (val: string) => {
        setSelectedValue(val);
        if (onValueChange) onValueChange(val);
        setOpen(false);
    };

    return (
        <SelectContext.Provider value={{ open, setOpen, selectedValue, handleSelect, disabled }}>
            <div ref={containerRef} className="relative w-full">{children}</div>
        </SelectContext.Provider>
    );
}

export function SelectTrigger({ children, className }: any) {
    const { open, setOpen, selectedValue, disabled } = React.useContext(SelectContext);
    return (
        <button
            disabled={disabled}
            type="button"
            className={`flex h-10 w-full items-center justify-between rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm ring-offset-background placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-eduGreen-500/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all ${className}`}
            onClick={() => setOpen(!open)}
        >
            {children}
            <ChevronDown className={`h-4 w-4 opacity-50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
    );
}

export function SelectValue({ placeholder }: any) {
    const { selectedValue, children } = React.useContext(SelectContext);
    // Note: In this simplified version, finding the label for a value is hard without extra props.
    // For now, we rely on the value being readable or the user just seeing the value.
    return <span className="truncate">{selectedValue || placeholder}</span>;
}

export function SelectContent({ children, className }: any) {
    const { open } = React.useContext(SelectContext);
    if (!open) return null;
    return (
        <div className={`absolute z-[100] mt-2 min-w-[8rem] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 top-full w-full ${className}`}>
            <div className="p-1 max-h-60 overflow-y-auto w-full thin-scrollbar">
                {children}
            </div>
        </div>
    );
}

export function SelectItem({ children, value, className }: any) {
    const { handleSelect, selectedValue } = React.useContext(SelectContext);
    const isSelected = selectedValue === value;
    return (
        <div
            className={`relative flex w-full cursor-pointer select-none items-center rounded-lg py-2.5 pl-4 pr-2 text-[10px] font-black uppercase tracking-widest outline-none transition-colors hover:bg-eduGreen-900/20 hover:text-eduGreen-400 ${isSelected ? 'bg-eduGreen-950/30 text-eduGreen-500' : 'text-zinc-400'} ${className}`}
            onClick={() => handleSelect(value)}
        >
            {children}
        </div>
    );
}
