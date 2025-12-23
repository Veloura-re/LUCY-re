import { redirect } from "next/navigation";
// import { getUserSession } from "@/lib/auth"; // Assumption
import { createClient } from "@/utils/supabase/server";

export default async function ExamLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-eduGreen-500/30">
            {children}
        </div>
    );
}
