"use client";

function isMobileDevice(): boolean {
  return typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// Schéma d'app non-officiel mais répandu pour ouvrir directement l'app LinkedIn (linkedin://in/..,
// linkedin://company/...). Pas garanti sur tous les téléphones/versions — d'où le repli automatique
// vers le lien web si l'app ne s'ouvre pas (ou n'est pas installée).
function toLinkedInAppUrl(href: string): string | null {
  try {
    const url = new URL(href);
    if (!url.hostname.endsWith("linkedin.com")) return null;
    return `linkedin://${url.pathname.replace(/^\//, "")}`;
  } catch {
    return null;
  }
}

/** Lien "Voir profil" : sur mobile, tente d'abord d'ouvrir l'app LinkedIn si le lien y mène,
 * et se rabat sur le navigateur si l'app ne prend pas la main (non installée, etc.).
 * Sur desktop ou pour les autres liens (Instagram, recherche Google), comportement standard. */
export default function ProfileLink({
  href,
  className,
  style,
  title,
  children,
}: {
  href: string;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  children: React.ReactNode;
}) {
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!isMobileDevice()) return;
    const appUrl = toLinkedInAppUrl(href);
    if (!appUrl) return;

    e.preventDefault();
    let hidden = false;
    const onVisibilityChange = () => {
      if (document.hidden) hidden = true;
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    window.location.href = appUrl;

    setTimeout(() => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (!hidden) window.open(href, "_blank", "noopener,noreferrer");
    }, 1500);
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      className={className}
      style={style}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
