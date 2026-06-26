export type MessageTemplate = {
  id: string;
  title: string;
  content: string;
  platform: "LINKEDIN" | "INSTAGRAM";
};

export const messageTemplates: MessageTemplate[] = [
  {
    id: "dm-linkedin-standard",
    title: "DM LinkedIn — version standard",
    platform: "LINKEDIN",
    content: `Bonjour [Prénom],

Je suis Coralie, graphiste et directrice artistique spécialisée dans le secteur animalier 🐾

J'ai accompagné plus de 20 marques dans la création de leur identité visuelle et de leurs supports de communication, pour valoriser leur image et rayonner auprès de leur communauté de passionnés d'animaux.

[Marque] fait partie des marques que j'admire dans le secteur. C'est pourquoi je me permets de vous contacter pour vous proposer mon expertise en freelance, avec toute la flexibilité et la réactivité que ce format permet, que ce soit en renfort ponctuel ou de façon plus régulière selon vos besoins.

Est-ce que cela pourrait répondre à vos besoins chez [Marque] ?

Vous pouvez découvrir mes réalisations sur coraliedealmeida.com ✨

À bientôt !

Coralie

(& Swan 🐶)`,
  },
  {
    id: "dm-linkedin-compliment",
    title: "DM LinkedIn — version compliment d'abord",
    platform: "LINKEDIN",
    content: `Bonjour [Prénom],

[Marque] fait partie des marques que j'admire dans le secteur animalier — [observation spécifique] me parle vraiment.

Je suis Coralie, graphiste et directrice artistique spécialisée dans le secteur animalier 🐾 J'ai accompagné plus de 20 marques dans la création de leur identité visuelle et de leurs supports de communication, pour valoriser leur image et rayonner auprès de leur communauté de passionnés d'animaux.

Je me permets de vous contacter pour vous proposer mon expertise en freelance, avec toute la flexibilité et la réactivité que ce format permet, que ce soit en renfort ponctuel ou de façon plus régulière selon vos besoins.

Est-ce que cela pourrait répondre à vos besoins chez [Marque] ?

Vous pouvez découvrir mes réalisations sur coraliedealmeida.com ✨

À bientôt !

Coralie

(& Swan 🐶)`,
  },
  {
    id: "dm-instagram-standard",
    title: "DM Instagram — version standard",
    platform: "INSTAGRAM",
    content: `Hello [Prénom],

Je suis Coralie, graphiste et directrice artistique spécialisée dans le secteur animalier 🐾

J'ai accompagné plus de 20 marques dans la création de leur identité visuelle et de leurs supports de communication, pour valoriser leur image et rayonner auprès de leur communauté.

J'adore l'univers de [Marque] et je me demandais si mes services pourraient correspondre à un besoin de ton côté — serais-tu ouverte à en discuter ? ☺️

Tu peux découvrir mes réalisations sur coraliedealmeida.com ✨

À bientôt peut-être !

Coralie & Swan 🐶`,
  },
  {
    id: "dm-instagram-compliment",
    title: "DM Instagram — version compliment d'abord",
    platform: "INSTAGRAM",
    content: `Hello [Prénom],

J'adore l'univers de [Marque] — [observation spécifique] me parle vraiment 🐾

Je suis Coralie, graphiste et directrice artistique spécialisée dans le secteur animalier. J'ai accompagné plus de 20 marques dans la création de leur identité visuelle et de leurs supports de communication, pour valoriser leur image et rayonner auprès de leur communauté.

Je me demandais si mes services pourraient correspondre à un besoin de ton côté — serais-tu ouverte à en discuter ? ☺️

Tu peux découvrir mes réalisations sur coraliedealmeida.com ✨

À bientôt peut-être !

Coralie & Swan 🐶`,
  },
  {
    id: "relance-1-linkedin",
    title: "Relance 1 — LinkedIn",
    platform: "LINKEDIN",
    content: `Bonjour [Prénom],

Je me permets de revenir vers vous suite à mon message du [date] — je sais que les agendas sont bien chargés en cette période. Je vous avais contactée au sujet d'une éventuelle collaboration créative en freelance...

Est-ce que cela pourrait répondre à vos besoins chez [Marque] ?

Belle journée,

Coralie`,
  },
  {
    id: "relance-2-linkedin",
    title: "Relance 2 — LinkedIn",
    platform: "LINKEDIN",
    content: `Bonjour [Prénom],

Je reviens une dernière fois, sans vouloir vous importuner — peut-être que le timing n'est simplement pas le bon en ce moment.

Je reste disponible si un besoin se présente du côté de [Marque], n'hésitez pas à revenir vers moi.

Belle continuation,

Coralie`,
  },
  {
    id: "relance-1-instagram",
    title: "Relance 1 — Instagram",
    platform: "INSTAGRAM",
    content: `Bonjour [Prénom] 👋

Je me permets de revenir vers toi suite à mon message — je sais que les DMs peuvent vite se perdre ! Je t'avais contactée au sujet d'une éventuelle collaboration créative...

Est-ce que ça pourrait correspondre à un besoin de ton côté ?

À bientôt peut-être,

Coralie`,
  },
  {
    id: "relance-2-instagram",
    title: "Relance 2 — Instagram",
    platform: "INSTAGRAM",
    content: `Bonjour [Prénom],

Je reviens une dernière fois, sans vouloir être trop insistante — peut-être que le timing n'est juste pas le bon en ce moment.

Je reste disponible si tu as un besoin du côté de [Marque], n'hésite pas à revenir vers moi 🐾

Belle continuation,

Coralie`,
  },
];
