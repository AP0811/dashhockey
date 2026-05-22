export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.1),_transparent_38%),linear-gradient(180deg,_#f8fafc_0%,_#f8fafc_100%)]">
      {children}
    </div>
  );
}
