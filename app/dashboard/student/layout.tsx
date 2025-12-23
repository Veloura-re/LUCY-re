export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {children}
        </div>
    );
}
