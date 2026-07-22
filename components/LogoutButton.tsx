"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="mt-4 w-fit rounded-xl px-4 py-3 text-sm font-semibold text-ink/40 transition hover:bg-white hover:text-ink md:hidden"
    >
      Se déconnecter
    </button>
  );
}
