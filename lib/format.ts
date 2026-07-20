/** Formatage monétaire unique de l'application — toujours au centime près (montants réels de facturation). */
export function formatRevenue(amount: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    amount
  );
}
