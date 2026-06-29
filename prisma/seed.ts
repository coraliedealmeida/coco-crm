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

  const servicesByName: Record<string, { id: string }> = {};
  for (let i = 0; i < services.length; i++) {
    const service = services[i];
    const existing = await prisma.service.findFirst({ where: { name: service.name } });
    const saved = existing
      ? await prisma.service.update({ where: { id: existing.id }, data: { order: i } })
      : await prisma.service.create({ data: { ...service, order: i } });
    servicesByName[service.name] = saved;
  }

  const bundles: { name: string; serviceNames: string[]; discountPercent: number }[] = [
    { name: "La Patte Digitale", serviceNames: ["La Patte", "Site One Page"], discountPercent: 10 },
    {
      name: "L'Empreinte Digitale",
      serviceNames: ["L'Empreinte (Kit RS inclus)", "Site Vitrine"],
      discountPercent: 10,
    },
  ];

  for (const bundle of bundles) {
    const existing = await prisma.bundle.findFirst({ where: { name: bundle.name } });
    if (!existing) {
      await prisma.bundle.create({
        data: {
          name: bundle.name,
          discountPercent: bundle.discountPercent,
          serviceIds: bundle.serviceNames.map((n) => servicesByName[n].id),
        },
      });
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
