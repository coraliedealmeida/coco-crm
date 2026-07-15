import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sectors = ["Nutrition", "Accessoires", "Santé", "Retail", "Événementiel", "Autre"];
const sources = ["Recherche", "Recommandation", "Salon", "Autre"];

const services: {
  name: string;
  category: string;
  price: number;
  priceType: "FIXED" | "HOURLY" | "MONTHLY";
  content: string;
}[] = [
  {
    name: "La Patte",
    category: "Identité visuelle",
    price: 1290,
    priceType: "FIXED",
    content:
      "Questionnaire stratégique\nStratégie visuelle + Moodboard\nLogo + déclinaisons\nPalette de couleurs\nTypographies\nBrandbook\n2 A/R inclus",
  },
  {
    name: "L'Empreinte (Kit RS inclus)",
    category: "Identité visuelle",
    price: 1990,
    priceType: "FIXED",
    content:
      "Questionnaire stratégique\nStratégie visuelle + Moodboard\nLogo + déclinaisons\nPalette de couleurs\nTypographies\n8 éléments graphiques\nKit RS\nBrandbook\n3 A/R inclus",
  },
  {
    name: "Kit RS (seul)",
    category: "Templates réseaux sociaux",
    price: 690,
    priceType: "FIXED",
    content:
      "Instagram : questionnaire stratégique, 3 modèles posts, 3 modèles carrousels, 3 modèles stories, 3 modèles couvertures reels, 4 couvertures story à la une, prévisualisation du feed, lien Canva\nLinkedIn : questionnaire stratégique, 4 modèles posts, 4 modèles carrousels, 1 bannière profil personnel, 1 bannière page entreprise, aperçu du profil, lien Canva",
  },
  {
    name: "Site One Page",
    category: "Site web",
    price: 1490,
    priceType: "FIXED",
    content:
      "Conception & intégration Framer\n1 page\nFormulaire de contact/réservation\nResponsive mobile/tablette/desktop\nOptimisation SEO/GEO\nMise en ligne\n2 révisions incluses\n30 min formation prise en main\n30 jours de disponibilité après livraison",
  },
  {
    name: "Site Vitrine",
    category: "Site web",
    price: 2290,
    priceType: "FIXED",
    content:
      "Conception & intégration Framer\n4 à 5 pages\nIntégration d'un CMS (blog/actualités)\nFormulaire de contact/réservation\nResponsive mobile/tablette/desktop\nOptimisation SEO/GEO\nMise en ligne\n3 révisions incluses\n30 min formation prise en main\n30 jours de disponibilité après livraison",
  },
  {
    name: "Rédaction contenus One Page",
    category: "Add-ons site web",
    price: 300,
    priceType: "FIXED",
    content: "Rédaction de tous les textes",
  },
  {
    name: "Rédaction contenus Site Vitrine",
    category: "Add-ons site web",
    price: 500,
    priceType: "FIXED",
    content: "Rédaction de tous les textes (toutes pages)",
  },
  {
    name: "Sourcing / banque d'images",
    category: "Add-ons site web",
    price: 150,
    priceType: "FIXED",
    content: "Sélection & achat Adobe Stock · max. 10 visuels",
  },
  {
    name: "Heures supplémentaires",
    category: "Add-ons site web",
    price: 65,
    priceType: "HOURLY",
    content: "Au-delà des révisions/A-R inclus, facturées à l'heure",
  },
  {
    name: "Maintenance",
    category: "Add-ons site web",
    price: 150,
    priceType: "MONTHLY",
    content:
      "Surveillance site\nMises à jour mineures\nChangements de photos et textes\nAjout d'articles de blog (contenu texte et visuel fourni par le client)\n\nEngagement 3 mois minimum · préavis résiliation 1 mois",
  },
  {
    name: "Graphisme à la carte",
    category: "Graphisme",
    price: 65,
    priceType: "HOURLY",
    content:
      "Toute création graphique sur devis : flyer, affiche, carte de visite, packaging, newsletter, signalétique...\n\nDevis préalable sur demande · minimum de facturation 1 heure",
  },
  {
    name: "Accompagnement mensuel",
    category: "Services récurrents",
    price: 850,
    priceType: "MONTHLY",
    content:
      "Création graphique dédiée\nToute prestation print, digital, RS\nBilan mensuel\nPriorité agenda\n\nEngagement 3 mois minimum · préavis résiliation 1 mois",
  },
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
      ? await prisma.service.update({ where: { id: existing.id }, data: { ...service, order: i } })
      : await prisma.service.create({ data: { ...service, order: i } });
    servicesByName[service.name] = saved;
  }

  const bundles: { name: string; serviceNames: string[]; discountPercent: number; description: string }[] = [
    {
      name: "La Patte Digitale",
      serviceNames: ["La Patte", "Site One Page"],
      discountPercent: 10,
      description: "Identité visuelle + site one page. Pour les marques qui lancent leur présence en ligne.",
    },
    {
      name: "L'Empreinte Digitale",
      serviceNames: ["L'Empreinte (Kit RS inclus)", "Site Vitrine"],
      discountPercent: 10,
      description:
        "Identité visuelle complète + site vitrine. Pour les marques établies qui veulent une présence web à la hauteur.",
    },
  ];

  for (const bundle of bundles) {
    const existing = await prisma.bundle.findFirst({ where: { name: bundle.name } });
    const data = {
      name: bundle.name,
      discountPercent: bundle.discountPercent,
      description: bundle.description,
      serviceIds: bundle.serviceNames.map((n) => servicesByName[n].id),
    };
    if (existing) {
      await prisma.bundle.update({ where: { id: existing.id }, data });
    } else {
      await prisma.bundle.create({ data });
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
