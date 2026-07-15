"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/marques", label: "Prospects" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/offre", label: "Offre" },
  { href: "/messages", label: "Ressources" },
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
        <Link href="/" className="mb-10 flex items-center px-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Dashboard Coco" className="h-14 w-auto object-contain" />
        </Link>

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
