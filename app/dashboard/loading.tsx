import { SpringingLoader } from "@/components/dashboard/springing-loader";

export default function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <SpringingLoader message="Initializing Secure Interface Hub" />
        </div>
    );
}
