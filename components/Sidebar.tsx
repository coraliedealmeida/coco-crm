"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/clients", label: "Projets" },
  { href: "/ressources", label: "Ressources" },
  { href: "/parametres", label: "Paramètres" },
];

// Ordre mobile : Pipeline | Projets | Dashboard (centre) | Ressources | Paramètres
const mobileLinks = [
  links[1], // Pipeline
  links[2], // Projets
  links[0], // Dashboard (centre, logo seul)
  links[3], // Ressources
  links[4], // Paramètres
];

const mobileIcons: Record<string, React.ReactNode> = {
  "/": (
    // Logo COCO à la place de l'icône maison
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo.svg" alt="" className="h-6 w-auto object-contain" />
  ),
  "/pipeline": (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  "/clients": (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  ),
  "/ressources": (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  ),
  "/parametres": (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* ── Desktop sidebar — texte seul, sans icônes ── */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col justify-between overflow-y-auto border-r border-soft bg-white px-5 py-7 md:flex">
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

      {/* ── Mobile bottom nav — pas de top bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-soft bg-white md:hidden">
        {mobileLinks.map((link) => {
          const active = pathname === link.href;
          const isCenter = link.href === "/";
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 transition ${
                active ? "text-accent" : "text-ink/40"
              }`}
            >
              <span className={`transition ${active ? "scale-110" : ""} ${isCenter ? "scale-125" : ""}`}>
                {mobileIcons[link.href]}
              </span>
              {!isCenter && (
                <span className="text-[9px] font-semibold leading-none">{link.label}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
