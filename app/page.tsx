import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap, Shield, Users, Calendar, ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-4 text-white relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-eduGreen-500/20 blur-[120px] rounded-full" />
      </div>

      <main className="flex flex-col items-center text-center space-y-8 max-w-3xl px-4 relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm text-sm font-semibold text-zinc-400">
          <Sparkles className="w-4 h-4 text-eduGreen-500 fill-eduGreen-500" />
          <span>Next-Generation School Management</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-eduGreen-500 to-emerald-400">
            LUCY
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl leading-relaxed">
          The advanced digital ecosystem connecting schools, parents, teachers, and students.
        </p>

        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mt-8">
          <div className="flex flex-col items-center gap-2 p-4 bg-zinc-900/30 rounded-xl border border-zinc-800">
            <Users className="w-8 h-8 text-eduGreen-500" />
            <span className="text-sm text-zinc-400">Multi-Role</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 bg-zinc-900/30 rounded-xl border border-zinc-800">
            <GraduationCap className="w-8 h-8 text-eduGreen-500" />
            <span className="text-sm text-zinc-400">Real-Time</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 bg-zinc-900/30 rounded-xl border border-zinc-800">
            <Shield className="w-8 h-8 text-eduGreen-500" />
            <span className="text-sm text-zinc-400">Secure</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 bg-zinc-900/30 rounded-xl border border-zinc-800">
            <Calendar className="w-8 h-8 text-eduGreen-500" />
            <span className="text-sm text-zinc-400">Organized</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link href="/login">
            <Button size="lg" className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white px-8 py-7 text-lg group rounded-2xl font-bold">
              Access Portal
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline" className="border-zinc-800 bg-zinc-900/50 hover:border-eduGreen-600 hover:text-eduGreen-500 px-8 py-7 text-lg rounded-2xl font-bold">
              Create Account
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
