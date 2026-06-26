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
    <aside className="flex h-screen w-64 flex-col justify-between border-r border-soft bg-white px-5 py-7">
      <div>
        <div className="mb-10 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-lg">
            🐾
          </div>
          <div>
            <p className="font-sans text-base font-extrabold leading-tight text-ink">Dashboard COCO</p>
            <p className="text-xs font-light text-ink/50">Coralie de Almeida</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  active ? "bg-accent text-white shadow-soft" : "text-ink/80 hover:bg-soft"
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
        className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-ink/50 transition hover:bg-soft hover:text-ink"
      >
        Se déconnecter
      </button>
    </aside>
  );
}
