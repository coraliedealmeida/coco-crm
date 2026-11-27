/** Formatage monétaire unique de l'application — toujours au centime près (montants réels de facturation). */
export function formatRevenue(amount: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    amount
  );
}

/** Date au format français, toujours en heure de Paris (le serveur Vercel est en UTC). */
export function formatDateFr(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" }
): string {
  return new Date(date).toLocaleDateString("fr-FR", { ...options, timeZone: "Europe/Paris" });
}
