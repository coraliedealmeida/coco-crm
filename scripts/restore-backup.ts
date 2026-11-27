/**
 * Restauration d'une sauvegarde COCO (fichier JSON reçu par email chaque matin).
 * Mode d'emploi complet : docs/restauration-sauvegarde.md
 *
 *   Vérifier un fichier (ne touche à aucune base) :
 *     npx tsx scripts/restore-backup.ts chemin/sauvegarde.json
 *
 *   Restaurer dans une base VIDE (branche Neon neuve, schéma déjà migré) :
 *     npx tsx scripts/restore-backup.ts chemin/sauvegarde.json --restaurer
 *
 * Sécurités : refuse d'écrire si la base cible contient déjà des marques, clients,
 * projets ou factures (on ne restaure jamais « par-dessus » des données).
 */
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { BACKUP_TABLES } from "../lib/backup";

type Delegate = {
  count: () => Promise<number>;
  createMany: (args: { data: unknown[]; skipDuplicates: boolean }) => Promise<{ count: number }>;
};

async function main() {
  const [file, flag] = process.argv.slice(2);
  if (!file) {
    console.error("Indique le fichier : npx tsx scripts/restore-backup.ts sauvegarde.json [--restaurer]");
    process.exit(1);
  }

  const backup = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
  console.log(`Sauvegarde du ${backup.exportedAt ?? "(date inconnue)"}`);
  const missing: string[] = [];
  for (const t of BACKUP_TABLES) {
    const rows = backup[t.key];
    if (Array.isArray(rows)) console.log(`  ${t.model.padEnd(20)} ${rows.length}`);
    else missing.push(t.model);
  }
  if (missing.length) {
    console.log(`  Absentes de ce fichier (ancien format) : ${missing.join(", ")}`);
  }

  if (flag !== "--restaurer") {
    console.log("\nVérification seule : aucune base n'a été modifiée.");
    return;
  }

  const prisma = new PrismaClient();
  try {
    const host = new URL(process.env.DATABASE_URL ?? "").host;
    console.log(`\nBase cible : ${host}`);
    const db = prisma as unknown as Record<string, Delegate>;
    for (const key of ["brand", "client", "project", "invoice"]) {
      const n = await db[key].count();
      if (n > 0) {
        console.error(`ARRÊT : la base cible n'est pas vide (${n} ligne(s) dans « ${key} »). Rien n'a été écrit.`);
        process.exit(1);
      }
    }
    for (const t of BACKUP_TABLES) {
      const rows = backup[t.key];
      if (!Array.isArray(rows) || rows.length === 0) continue;
      const { count } = await db[t.delegate].createMany({ data: rows, skipDuplicates: true });
      console.log(`  ${t.model.padEnd(20)} ${count} / ${rows.length} restaurée(s)`);
    }
    console.log("\nRestauration terminée.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
