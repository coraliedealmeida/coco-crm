import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sectors = ["Nutrition", "Accessoires", "Santé", "Retail", "Événementiel", "Autre"];
const sources = ["Recherche", "Recommandation", "Salon", "Autre"];

async function main() {
  for (const label of sectors) {
    await prisma.sectorOption.upsert({
      where: { label },
      update: {},
      create: { label },
    });
  }

  for (const label of sources) {
    await prisma.sourceOption.upsert({
      where: { label },
      update: {},
      create: { label },
    });
  }

  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  console.log("Seed terminé.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
