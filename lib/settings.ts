import { prisma } from "@/lib/prisma";

/** Lit les Paramètres (délais de relance, etc.), en les créant avec les valeurs par défaut au premier appel. */
export function getSettings() {
  return prisma.settings.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } });
}
