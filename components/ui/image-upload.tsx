"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    disabled?: boolean;
    bucket?: string; // default 'avatars'
}

export function ImageUpload({ value, onChange, disabled, bucket = 'avatars' }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState(value);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview immediately
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('bucket', bucket);

            const res = await fetch('/api/school/upload', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Upload failed");
            }

            const data = await res.json();
            onChange(data.url);
            setPreview(data.url);
        } catch (error) {
            console.error("Upload failed", error);
            // Revert preview if failed?
            setPreview(value);
            // Could show toast error here
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemove = () => {
        onChange("");
        setPreview("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="flex items-center gap-6">
            <div className="relative group">
                <Avatar className="h-24 w-24 rounded-2xl border-2 border-dashed border-zinc-800 bg-zinc-900/50">
                    <AvatarImage src={preview} className="object-cover" />
                    <AvatarFallback className="bg-transparent">
                        {isUploading ? <Loader2 className="w-8 h-8 text-eduGreen-500 animate-spin" /> : <ImageIcon className="w-8 h-8 text-zinc-700" />}
                    </AvatarFallback>
                </Avatar>
                {preview && !isUploading && (
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>

            <div className="space-y-2">
                <Button
                    type="button"
                    variant="outline"
                    disabled={disabled || isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300 h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest"
                >
                    <Upload className="w-3 h-3 mr-2" />
                    {isUploading ? "Uploading..." : "Upload Photo"}
                </Button>
                <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-wide">
                    Max 5MB. JPG, PNG, WEBP.
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={disabled || isUploading}
            />
        </div>
    );
}
