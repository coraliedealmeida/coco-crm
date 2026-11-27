/**
 * Outils « prospects importés » utilisables dans l'interface (navigateur) :
 * aucun accès à la base ici. Le code serveur est dans lib/prospectImport.ts.
 */

export type Contact = { name: string; position: string; profileUrl: string; platform: string };

export type QualificationProspect = {
  id: string;
  rawName: string;
  handle: string | null;
  platform: string;
  brandCategory: string | null;
  profileUrl: string | null;
  contacts: Contact[];
};

/** Lien le plus utile pour retrouver la marque : sa propre page (LinkedIn/Instagram) si connue,
 * sinon le profil du premier contact identifié, sinon une recherche du site officiel — pour ne
 * jamais laisser le lien vide, même quand rien n'a été récupéré à l'import. */
export function bestProfileLink(p: {
  rawName: string;
  platform: string;
  profileUrl: string | null;
  contacts: Contact[];
}): string {
  if (p.profileUrl) return p.profileUrl;
  if (p.contacts[0]?.profileUrl) return p.contacts[0].profileUrl;
  return `https://www.google.com/search?q=${encodeURIComponent(`${p.rawName} site officiel`)}`;
}
