import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Check if user is Director/Principal
        const dbUser = await prisma.user.findUnique({
            where: { id: authUser.id },
            select: { role: true, schoolId: true }
        });

        if (!dbUser || (dbUser.role !== 'PRINCIPAL' && dbUser.role !== 'SUPERADMIN')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'Missing file' }, { status: 400 });
        }

        const fileExtension = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
        const filePath = `${dbUser.schoolId}/${fileName}`;

        // Upload to Supabase Storage - 'books' bucket
        // Ensure this bucket exists in Supabase
        const { data, error } = await supabase.storage
            .from('books')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Storage error:', error);
            // Handle bucket not found gracefully with a helpful message
            if ((error as any).status === 404 || (error as any).message?.includes('not found')) {
                return NextResponse.json({
                    error: 'Storage Bucket Not Found: Please ensure a public bucket named "books" exists in Supabase.'
                }, { status: 404 });
            }
            return NextResponse.json({ error: 'Upload failed: ' + error.message }, { status: 500 });
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('books')
            .getPublicUrl(filePath);

        return NextResponse.json({
            url: publicUrl,
            name: file.name,
            size: file.size
        });
    } catch (e) {
        console.error("[BOOKS_UPLOAD]", e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
