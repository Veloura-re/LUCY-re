import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
    size?: "sm" | "md" | "lg" | "icon";
    isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={isLoading || disabled}
                className={cn(
                    "inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-eduGreen-500 focus-visible:ring-offset-0 disabled:opacity-50 disabled:pointer-events-none rounded-button active:scale-[0.98]",
                    {
                        "bg-eduGreen-600 text-white hover:bg-eduGreen-500": variant === "primary",
                        "bg-zinc-900 text-eduGreen-400 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700": variant === "secondary",
                        "bg-red-950/20 text-red-500 border border-red-900/20 hover:bg-red-950/40 hover:border-red-500/50": variant === "danger",
                        "hover:bg-zinc-900 text-zinc-500 hover:text-white": variant === "ghost",
                        "border border-zinc-800 bg-transparent hover:bg-zinc-900/50 text-zinc-500 hover:text-white": variant === "outline",
                        "h-8 px-3 text-sm": size === "sm",
                        "h-10 px-4 py-2": size === "md",
                        "h-12 px-6 text-lg": size === "lg",
                        "h-10 w-10 p-0 text-zinc-500 hover:text-white": size === "icon",
                    },
                    className
                )}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-current" />}
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";

export { Button };
