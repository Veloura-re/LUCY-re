"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const SelectContext = React.createContext<any>(null);

export function Select({ children, onValueChange, value, disabled }: any) {
    const [open, setOpen] = React.useState(false);
    const [selectedValue, setSelectedValue] = React.useState(value);
    const [itemMap, setItemMap] = React.useState<Record<string, React.ReactNode>>({});
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        setSelectedValue(value);
    }, [value]);

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

    const registerItem = React.useCallback((val: string, label: React.ReactNode) => {
        setItemMap(prev => {
            if (prev[val] === label) return prev;
            return { ...prev, [val]: label };
        });
    }, []);

    const handleSelect = (val: string) => {
        setSelectedValue(val);
        if (onValueChange) onValueChange(val);
        setOpen(false);
    };

    return (
        <SelectContext.Provider value={{ open, setOpen, selectedValue, handleSelect, disabled, registerItem, itemMap }}>
            <div ref={containerRef} className="relative w-full group">{children}</div>
        </SelectContext.Provider>
    );
}

export function SelectTrigger({ children, className }: any) {
    const { open, setOpen, disabled } = React.useContext(SelectContext);
    return (
        <button
            disabled={disabled}
            type="button"
            className={cn(
                "flex h-14 w-full items-center justify-between rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-xl px-4 py-2 text-xs font-black uppercase tracking-widest text-zinc-100 transition-all hover:border-eduGreen-900/40 focus:outline-none focus:ring-2 focus:ring-eduGreen-600/20 disabled:cursor-not-allowed disabled:opacity-50",
                open ? "border-eduGreen-600/50 shadow-[0_0_20px_rgba(20,122,82,0.1)]" : "shadow-2xl",
                className
            )}
            onClick={() => setOpen(!open)}
        >
            <div className="flex items-center gap-3">{children}</div>
            <ChevronDown className={cn("h-4 w-4 text-zinc-600 transition-transform duration-300", open ? "rotate-180 text-eduGreen-500" : "")} />
        </button>
    );
}

export function SelectValue({ placeholder }: any) {
    const { selectedValue, itemMap } = React.useContext(SelectContext);
    const label = selectedValue ? itemMap[selectedValue] : null;
    return (
        <span className={cn("truncate font-black", !label ? "text-zinc-700" : "text-white")}>
            {label || placeholder}
        </span>
    );
}

export function SelectContent({ children, className }: any) {
    const { open } = React.useContext(SelectContext);
    if (!open) return null;
    return (
        <div className={cn(
            "absolute z-[100] mt-3 min-w-[8rem] overflow-hidden rounded-[2rem] border border-zinc-900 bg-zinc-950/95 backdrop-blur-3xl p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300 top-full w-full",
            className
        )}>
            <div className="max-h-68 overflow-y-auto space-y-1 p-1 thin-scrollbar">
                {children}
            </div>
        </div>
    );
}

export function SelectItem({ children, value, className }: any) {
    const { handleSelect, selectedValue, registerItem } = React.useContext(SelectContext);
    const isSelected = selectedValue === value;

    React.useEffect(() => {
        registerItem(value, children);
    }, [value, children, registerItem]);

    return (
        <div
            className={cn(
                "relative flex w-full cursor-pointer select-none items-center justify-between rounded-xl py-3 px-4 text-[10px] font-black uppercase tracking-widest outline-none transition-all",
                isSelected
                    ? "bg-eduGreen-950/30 text-eduGreen-400 border border-eduGreen-900/20"
                    : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200",
                className
            )}
            onClick={() => handleSelect(value)}
        >
            <span className="truncate">{children}</span>
            {isSelected && <Check className="w-3.5 h-3.5 text-eduGreen-500 animate-in zoom-in-50 duration-300" />}
        </div>
    );
}
