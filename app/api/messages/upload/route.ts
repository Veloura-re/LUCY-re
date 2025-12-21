import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const chatRoomId = formData.get('chatRoomId') as string;

        if (!file || !chatRoomId) {
            return NextResponse.json({ error: 'Missing file or chatRoomId' }, { status: 400 });
        }

        // Verify membership
        const membership = await prisma.chatRoomMember.findUnique({
            where: { chatRoomId_userId: { chatRoomId, userId: authUser.id } }
        });

        if (!membership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const filePath = `${chatRoomId}/${fileName}`;

        // Upload to Supabase Storage
        // NOTE: Ensure 'messages' bucket exists and is public or has appropriate policies
        const { data, error } = await supabase.storage
            .from('messages')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Storage error:', error);
            if ((error as any).status === 404 || (error as any).message?.includes('not found')) {
                return NextResponse.json({
                    error: 'Storage Infrastructure Missing: Please create a public bucket named "messages" in your Supabase project to enable attachments.'
                }, { status: 404 });
            }
            return NextResponse.json({ error: 'Upload failed: ' + error.message }, { status: 500 });
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('messages')
            .getPublicUrl(filePath);

        return NextResponse.json({
            url: publicUrl,
            name: file.name,
            type: file.type,
            size: file.size
        });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
