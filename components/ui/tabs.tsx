"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const TabsContext = React.createContext<{
    value: string
    onValueChange: (value: string) => void
} | null>(null)

export function Tabs({
    value: controlledValue,
    defaultValue,
    onValueChange,
    className,
    children,
    ...props
}: any) {
    const [value, setValue] = React.useState(controlledValue || defaultValue)

    React.useEffect(() => {
        if (controlledValue !== undefined) {
            setValue(controlledValue)
        }
    }, [controlledValue])

    const handleValueChange = React.useCallback(
        (newValue: string) => {
            setValue(newValue)
            onValueChange?.(newValue)
        },
        [onValueChange]
    )

    return (
        <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
            <div className={cn("w-full", className)} {...props}>
                {children}
            </div>
        </TabsContext.Provider>
    )
}

export function TabsList({ className, ...props }: any) {
    return (
        <div
            className={cn(
                "inline-flex h-12 items-center justify-center rounded-2xl bg-zinc-950/40 backdrop-blur-xl border border-zinc-900/50 p-1.5 text-zinc-500 shadow-2xl",
                className
            )}
            {...props}
        />
    )
}

export function TabsTrigger({ value, className, ...props }: any) {
    const context = React.useContext(TabsContext)
    if (!context) throw new Error("TabsTrigger must be used within Tabs")

    const isActive = context.value === value

    return (
        <button
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => context.onValueChange(value)}
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-xl px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
                isActive
                    ? "bg-eduGreen-600 text-white shadow-lg shadow-eduGreen-900/20"
                    : "hover:text-zinc-200 hover:bg-zinc-900/50",
                className
            )}
            {...props}
        />
    )
}

export function TabsContent({ value, className, ...props }: any) {
    const context = React.useContext(TabsContext)
    if (!context) throw new Error("TabsContent must be used within Tabs")

    if (context.value !== value) return null

    return (
        <div
            role="tabpanel"
            className={cn(
                "mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2",
                className
            )}
            {...props}
        />
    )
}
