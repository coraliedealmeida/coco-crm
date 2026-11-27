"use client";

/**
 * Remplace `fetch` pour les appels à l'API de COCO depuis l'interface.
 *
 * Avant : si un enregistrement échouait (coupure réseau, erreur serveur, session
 * expirée), l'écran gardait la saisie comme si tout allait bien.
 * Maintenant : tout échec affiche un message (composant `SaveErrorToaster`).
 *
 * Options :
 * - `expected` : statuts « normaux » gérés par l'appelant (ex. 409) → pas de message.
 * - `quiet` : l'appelant affiche lui-même son message d'erreur.
 */
export const SAVE_ERROR_EVENT = "coco:save-error";

export type SaveErrorDetail = { message: string; sessionExpired: boolean; kind?: "error" | "info" };

type Options = { expected?: number[]; quiet?: boolean };

function notify(detail: SaveErrorDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<SaveErrorDetail>(SAVE_ERROR_EVENT, { detail }));
}

export async function apiFetch(
  input: string,
  init?: RequestInit,
  options: Options = {}
): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(input, init);
  } catch {
    const message = "Pas de connexion au serveur : la modification n'a pas été enregistrée.";
    if (!options.quiet) notify({ message, sessionExpired: false });
    return new Response(JSON.stringify({ error: message }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Le middleware renvoie la page de connexion (redirection) quand la session a expiré.
  const sessionExpired = res.status === 401 || (res.redirected && res.url.includes("/login"));
  if (sessionExpired) {
    if (!options.quiet) {
      notify({ message: "Ta session a expiré : la modification n'a pas été enregistrée.", sessionExpired: true });
    }
    return res.status === 401
      ? res
      : new Response(JSON.stringify({ error: "Session expirée." }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
  }

  // Annulation d'un « Devis accepté » : prévenir de ce qui a été masqué ou conservé.
  if (res.ok && init?.method && init.method !== "GET") {
    try {
      const data = await res.clone().json();
      const notice = cancelledAcceptanceNotice(data);
      if (notice) notify({ message: notice, sessionExpired: false, kind: "info" });
    } catch {
      // pas de JSON : rien à signaler
    }
  }

  if (!res.ok && !options.quiet && !options.expected?.includes(res.status)) {
    let message = `Erreur ${res.status} : la modification n'a pas été enregistrée.`;
    try {
      const data = await res.clone().json();
      if (data && typeof data.error === "string") message = `${data.error} (non enregistré)`;
    } catch {
      // réponse non JSON : on garde le message générique
    }
    notify({ message, sessionExpired: false });
  }
  return res;
}

function plural(n: number, one: string, many: string) {
  return n > 1 ? many : one;
}

export function cancelledAcceptanceNotice(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const { projectsHidden, projectsKept } = data as { projectsHidden?: unknown; projectsKept?: unknown };
  if (typeof projectsHidden !== "number" || typeof projectsKept !== "number") return null;
  const parts: string[] = [];
  if (projectsHidden > 0) {
    parts.push(
      `${projectsHidden} ${plural(projectsHidden, "projet créé par ce devis a été masqué", "projets créés par ce devis ont été masqués")} ` +
        `(Paramètres → Corbeille). ${plural(projectsHidden, "Il réapparaîtra", "Ils réapparaîtront")} si le devis est de nouveau accepté.`
    );
  }
  if (projectsKept > 0) {
    parts.push(
      `${projectsKept} ${plural(projectsKept, "projet contient", "projets contiennent")} déjà des informations : ` +
        `${plural(projectsKept, "il reste", "ils restent")} dans Projets.`
    );
  }
  return parts.length ? parts.join(" ") : null;
}
