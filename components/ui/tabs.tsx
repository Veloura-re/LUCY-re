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
                "inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 p-1 text-zinc-400",
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
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                isActive ? "bg-black text-white shadow-sm" : "hover:bg-zinc-800 hover:text-zinc-100",
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
