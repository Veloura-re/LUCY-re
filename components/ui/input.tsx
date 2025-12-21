import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, error, icon, ...props }, ref) => {
        return (
            <div className="w-full space-y-1">
                {label && (
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">
                            {icon}
                        </div>
                    )}
                    <input
                        type={type}
                        className={cn(
                            "flex h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:ring-1 focus:ring-eduGreen-500/50 focus:border-eduGreen-500/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
                            {
                                "pl-10": icon,
                                "border-red-900/50 focus:ring-red-500/50": error,
                            },
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                </div>
                {error && <p className="text-[10px] text-red-500 ml-1 font-medium">{error}</p>}
            </div>
        );
    }
);
Input.displayName = "Input";

export { Input };
