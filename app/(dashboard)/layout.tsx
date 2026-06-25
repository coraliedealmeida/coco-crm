import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-soft px-10 py-8">{children}</main>
    </div>
  );
}
