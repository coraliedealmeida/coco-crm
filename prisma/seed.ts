import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sectors = ["Nutrition", "Accessoires", "Santé", "Retail", "Événementiel", "Autre"];
const sources = ["Recherche", "Recommandation", "Salon", "Autre"];

const services: { name: string; category: string; price: number; priceType: "FIXED" | "HOURLY" | "MONTHLY" }[] = [
  { name: "La Patte", category: "Identité visuelle", price: 1290, priceType: "FIXED" },
  { name: "L'Empreinte (Kit RS inclus)", category: "Identité visuelle", price: 1990, priceType: "FIXED" },
  { name: "Kit RS (seul)", category: "Templates réseaux sociaux", price: 690, priceType: "FIXED" },
  { name: "Site One Page", category: "Site web", price: 1690, priceType: "FIXED" },
  { name: "Site Vitrine", category: "Site web", price: 2990, priceType: "FIXED" },
  { name: "Rédaction contenus One Page", category: "Add-ons site web", price: 300, priceType: "FIXED" },
  { name: "Rédaction contenus Site Vitrine", category: "Add-ons site web", price: 500, priceType: "FIXED" },
  { name: "Sourcing / banque d'images", category: "Add-ons site web", price: 150, priceType: "FIXED" },
  { name: "Heures supplémentaires", category: "Add-ons site web", price: 65, priceType: "HOURLY" },
  { name: "Graphisme à la carte", category: "Graphisme", price: 65, priceType: "HOURLY" },
  { name: "Accompagnement mensuel", category: "Services récurrents", price: 850, priceType: "MONTHLY" },
  { name: "Maintenance", category: "Services récurrents", price: 150, priceType: "MONTHLY" },
];

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

  for (const service of services) {
    const existing = await prisma.service.findFirst({ where: { name: service.name } });
    if (!existing) {
      await prisma.service.create({ data: service });
    }
  }

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
