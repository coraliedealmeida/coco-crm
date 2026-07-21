"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/clients", label: "Projets" },
  { href: "/ressources", label: "Ressources" },
  { href: "/parametres", label: "Paramètres" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-soft bg-white px-4 py-3 md:hidden">
        <Link href="/" className="flex items-center" onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Dashboard Coco" className="h-9 w-auto object-contain" />
        </Link>
        <button
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-ink/70 hover:bg-soft"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 bg-ink/30 md:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col justify-between overflow-y-auto border-r border-soft bg-white px-5 py-7 transition-transform duration-200 md:sticky md:top-0 md:translate-x-0 md:transition-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          <Link href="/" className="mb-10 hidden items-center px-2 md:flex" onClick={() => setOpen(false)}>
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
                  onClick={() => setOpen(false)}
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
    </>
  );
}
