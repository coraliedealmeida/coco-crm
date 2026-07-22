import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-soft px-4 py-6 pb-28 md:pb-8 md:px-10 md:py-8">{children}</main>
    </div>
  );
}
