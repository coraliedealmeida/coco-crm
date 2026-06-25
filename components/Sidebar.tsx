"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/marques", label: "Marques prospects" },
  { href: "/pipeline", label: "Pipeline prospection" },
  { href: "/messages", label: "Messages types" },
  { href: "/parametres", label: "Paramètres" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 flex-col justify-between border-r border-soft bg-white px-5 py-6">
      <div>
        <div className="mb-8 px-2">
          <p className="font-sans text-xl font-extrabold text-ink">CRM Prospection</p>
          <p className="text-xs font-light text-ink/60">Coralie de Almeida</p>
        </div>

        <nav className="flex flex-col gap-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  active ? "bg-accent text-white" : "text-ink hover:bg-soft"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <button
        onClick={handleLogout}
        className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-ink/60 transition hover:bg-soft"
      >
        Se déconnecter
      </button>
    </aside>
  );
}
