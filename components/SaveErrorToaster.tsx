"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SAVE_ERROR_EVENT, type SaveErrorDetail } from "@/lib/apiClient";

/**
 * Affiche un message en bas de l'écran quand un enregistrement échoue
 * (événement envoyé par `apiFetch`). Recharge les données affichées pour
 * montrer l'état réellement enregistré.
 */
export default function SaveErrorToaster() {
  const router = useRouter();
  const [error, setError] = useState<SaveErrorDetail | null>(null);

  useEffect(() => {
    function onError(event: Event) {
      const detail = (event as CustomEvent<SaveErrorDetail>).detail;
      setError(detail);
      if (detail.kind !== "info") router.refresh();
    }
    window.addEventListener(SAVE_ERROR_EVENT, onError);
    return () => window.removeEventListener(SAVE_ERROR_EVENT, onError);
  }, [router]);

  useEffect(() => {
    if (!error || error.sessionExpired) return;
    const timer = setTimeout(() => setError(null), 10000);
    return () => clearTimeout(timer);
  }, [error]);

  if (!error) return null;

  return (
    <div
      role={error.kind === "info" ? "status" : "alert"}
      className="fixed bottom-24 right-4 z-50 flex max-w-sm items-start gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-white shadow-soft md:bottom-6"
    >
      <span
        aria-hidden
        className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${error.kind === "info" ? "bg-accent-light" : "bg-red-400"}`}
      />
      <div className="flex-1">
        <p className="font-semibold">{error.message}</p>
        {error.sessionExpired ? (
          <a href="/login" className="mt-1 inline-block font-semibold text-accent-light underline">
            Me reconnecter
          </a>
        ) : error.kind === "info" ? null : (
          <p className="mt-1 font-light text-white/80">L&apos;écran affiche maintenant l&apos;état réellement enregistré.</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => setError(null)}
        aria-label="Fermer"
        className="text-white/70 hover:text-white"
      >
        ✕
      </button>
    </div>
  );
}
