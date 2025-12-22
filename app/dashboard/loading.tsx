import { SpringingLoader } from "@/components/dashboard/springing-loader";

export default function Loading() {
    return (
        <div className="flex h-full min-h-[60vh] items-center justify-center">
            <SpringingLoader message="Synthesizing Institutional Intelligence" />
        </div>
    );
}
