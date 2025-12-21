import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { InviteForm } from "./invite-form"; // Client component
import { ShieldCheck, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function InvitePage({ params }: { params: { token: string } }) {
    const { token } = await params;

    // Verify token
    const invite = await prisma.inviteToken.findUnique({
        where: { token },
    });

    if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-red-500/20 blur-[120px]" />
                </div>

                <Card className="w-full max-w-md bg-zinc-900/90 border-zinc-800 shadow-2xl relative z-10">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-4 border border-zinc-700">
                            <AlertCircle className="w-6 h-6 text-red-500" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-white">Invalid or Expired Invite</CardTitle>
                        <CardDescription className="text-zinc-400">
                            This invitation link is no longer valid.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-zinc-500 text-sm">
                            Please contact your school administrator for a new invitation.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Fetch school name
    const school = invite.schoolId ? await prisma.school.findUnique({ where: { id: invite.schoolId } }) : null;

    // Format role for display (e.g. PRINCIPAL -> Principal, TEACHER -> Teacher)
    const formattedRole = invite.role.charAt(0) + invite.role.slice(1).toLowerCase();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-eduGreen-500/20 blur-[120px]" />
            </div>

            <Card className="w-full max-w-md bg-zinc-900/90 border-zinc-800 shadow-2xl relative z-10">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-4 border border-zinc-700">
                        <ShieldCheck className="w-6 h-6 text-eduGreen-500" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">Welcome, {formattedRole === 'Principal' ? 'Director' : formattedRole}</CardTitle>
                    <CardDescription className="text-zinc-400">
                        You have been invited to join <span className="text-eduGreen-500 font-semibold">{school?.name || "New School"}</span>
                    </CardDescription>
                </CardHeader>

                <InviteForm
                    token={token}
                    email={invite.email}
                    schoolName={school?.name || ""}
                    role={invite.role}
                />
            </Card>
        </div>
    );
}
