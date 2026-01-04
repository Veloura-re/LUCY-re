import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BooksView } from "@/components/dashboard/books-view";

export default async function BooksPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { school: true }
    });

    if (!dbUser) redirect("/login");

    return (
        <BooksView user={dbUser} school={dbUser.school} />
    );
}
