import type { PrismaClient } from "@prisma/client";

/**
 * Liste de TOUTES les tables de la base, dans l'ordre de restauration
 * (une table « parente » passe toujours avant les tables qui pointent vers elle).
 *
 * Toute nouvelle table ajoutée dans `prisma/schema.prisma` doit être ajoutée ici :
 * le test `tests/backup.test.ts` échoue sinon, pour qu'aucune donnée ne soit
 * oubliée par la sauvegarde quotidienne.
 */
export const BACKUP_TABLES = [
  { key: "sectors", model: "SectorOption", delegate: "sectorOption" },
  { key: "sources", model: "SourceOption", delegate: "sourceOption" },
  { key: "settings", model: "Settings", delegate: "settings" },
  { key: "services", model: "Service", delegate: "service" },
  { key: "bundles", model: "Bundle", delegate: "bundle" },
  { key: "dashboardTasks", model: "DashboardTask", delegate: "dashboardTask" },
  { key: "dashboardNotes", model: "DashboardNote", delegate: "dashboardNote" },
  { key: "brands", model: "Brand", delegate: "brand" },
  { key: "brandContacts", model: "BrandContact", delegate: "brandContact" },
  { key: "contactHistory", model: "ContactHistoryEntry", delegate: "contactHistoryEntry" },
  { key: "prospectImports", model: "ProspectImport", delegate: "prospectImport" },
  { key: "clients", model: "Client", delegate: "client" },
  { key: "quoteRequests", model: "QuoteRequest", delegate: "quoteRequest" },
  { key: "projects", model: "Project", delegate: "project" },
  { key: "projectNotes", model: "ProjectNote", delegate: "projectNote" },
  { key: "invoices", model: "Invoice", delegate: "invoice" },
  { key: "reminders", model: "Reminder", delegate: "reminder" },
] as const;

export type BackupKey = (typeof BACKUP_TABLES)[number]["key"];

export type BackupFile = {
  format: "coco-backup";
  version: 2;
  exportedAt: string;
  counts: Record<BackupKey, number>;
} & Record<BackupKey, unknown[]>;

type FindManyDelegate = { findMany: () => Promise<unknown[]> };

/** Lit toutes les tables et construit le fichier de sauvegarde. */
export async function buildBackup(prisma: PrismaClient): Promise<BackupFile> {
  const rows = await Promise.all(
    BACKUP_TABLES.map((t) => (prisma[t.delegate] as unknown as FindManyDelegate).findMany())
  );
  const data = {} as Record<BackupKey, unknown[]>;
  const counts = {} as Record<BackupKey, number>;
  BACKUP_TABLES.forEach((t, i) => {
    data[t.key] = rows[i];
    counts[t.key] = rows[i].length;
  });
  return { format: "coco-backup", version: 2, exportedAt: new Date().toISOString(), counts, ...data };
}
