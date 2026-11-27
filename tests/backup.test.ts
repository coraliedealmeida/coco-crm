import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BACKUP_TABLES } from "@/lib/backup";

describe("sauvegarde quotidienne", () => {
  it("contient toutes les tables du schéma Prisma", () => {
    const schema = readFileSync("prisma/schema.prisma", "utf8");
    const models = [...schema.matchAll(/^model (\w+) \{/gm)].map((m) => m[1]).sort();
    const saved = BACKUP_TABLES.map((t) => t.model).sort();
    expect(saved).toEqual(models);
  });
});
