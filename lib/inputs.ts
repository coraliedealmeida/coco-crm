import type { KeyboardEvent } from "react";

/** Touche Entrée dans un champ d'une ligne = valider (quitte le champ, ce qui déclenche l'enregistrement). */
export function blurOnEnter(e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
  if (e.key === "Enter") e.currentTarget.blur();
}
