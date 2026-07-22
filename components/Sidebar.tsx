"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  {
    href: "/",
    label: "Dashboard",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/pipeline",
    label: "Pipeline",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    href: "/clients",
    label: "Projets",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    href: "/ressources",
    label: "Ressources",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
  },
  {
    href: "/parametres",
    label: "Paramètres",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
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
      {/* ── Desktop sidebar ── */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between overflow-y-auto border-r border-soft bg-white px-5 py-7 md:flex">
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
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    active ? "bg-accent text-white shadow-soft" : "text-ink/80 hover:bg-soft"
                  }`}
                >
                  <span className={active ? "opacity-100" : "opacity-60"}>{link.icon}</span>
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

      {/* ── Mobile top bar (logo only) ── */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-soft bg-white px-4 py-3 md:hidden">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Dashboard Coco" className="h-9 w-auto object-contain" />
        </Link>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-xl px-3 py-1.5 text-xs font-semibold text-ink/40 hover:text-ink"
        >
          Déconnexion
        </button>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-soft bg-white md:hidden">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-1 flex-col items-center gap-1 px-1 pb-5 pt-3 text-[10px] font-semibold transition ${
                active ? "text-accent" : "text-ink/40"
              }`}
            >
              <span className={`transition ${active ? "scale-110" : ""}`}>{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout overlay (unused on mobile but keep for completeness) */}
      {open && <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)} />}
    </>
  );
}
