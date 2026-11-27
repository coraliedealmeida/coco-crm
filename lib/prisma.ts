import { PrismaClient } from "@prisma/client";

/**
 * Deux accès à la base :
 *
 * - `prisma` (à utiliser partout) : masque automatiquement les éléments à la corbeille
 *   (`deletedAt` renseigné) pour les marques, clients, projets, factures, demandes de devis et
 *   prospects importés — sur les lectures directes (findMany, findFirst, findUnique, count…).
 *   ⚠️ Les relations incluses (`include: { projects: … }`) ne sont PAS filtrées automatiquement :
 *   utiliser `NOT_DELETED` (ex. `projects: { where: NOT_DELETED }`).
 *   Pour lire volontairement la corbeille, préciser `deletedAt` dans le `where`.
 *
 * - `prismaRaw` : accès brut, sans filtre (sauvegarde, corbeille, restauration, contrôles).
 */

export const TRASHABLE_MODELS = ["Brand", "Client", "Project", "Invoice", "QuoteRequest", "ProspectImport"] as const;

/** Filtre à mettre dans les relations incluses : `{ where: NOT_DELETED }`. */
export const NOT_DELETED = { deletedAt: null } as const;

const READ_OPERATIONS = new Set([
  "findMany",
  "findFirst",
  "findFirstOrThrow",
  "findUnique",
  "findUniqueOrThrow",
  "count",
  "aggregate",
  "groupBy",
]);

function createRawClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function withTrashFilter(client: PrismaClient) {
  return client.$extends({
    name: "corbeille",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (
            (TRASHABLE_MODELS as readonly string[]).includes(model) &&
            READ_OPERATIONS.has(operation)
          ) {
            const a = (args ?? {}) as { where?: Record<string, unknown> };
            if (!a.where || !("deletedAt" in a.where)) {
              a.where = { ...(a.where ?? {}), deletedAt: null };
            }
            return query(a as typeof args);
          }
          return query(args);
        },
      },
    },
  });
}

const globalForPrisma = global as unknown as {
  prismaRaw?: PrismaClient;
  prisma?: ReturnType<typeof withTrashFilter>;
};

export const prismaRaw = globalForPrisma.prismaRaw ?? createRawClient();
export const prisma = globalForPrisma.prisma ?? withTrashFilter(prismaRaw);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaRaw = prismaRaw;
  globalForPrisma.prisma = prisma;
}
