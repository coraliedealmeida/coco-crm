import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { parse as csvParse } from "csv-parse/sync";

const ROOT = process.cwd();

const ANIMAL_KEYWORDS = [
  "animal", "animaux", "animalier", "animalerie", "pet", "pets", "chien", "chiens", "chat", "chats",
  "dog", "dogs", "cat", "cats", "canin", "canine", "félin", "felin", "feline", "vétérinaire",
  "veterinaire", "veterinary", "vet", "veto", "zoo", "zoologique", "faune", "wildlife", "nature",
  "équin", "equin", "equine", "cheval", "chevaux", "horse", "équestre", "equestre", "equestrian",
  "lapin", "rabbit", "rongeur", "reptile", "oiseau", "bird", "aquarium", "poisson", "fish",
  "ferme", "farm", "élevage", "elevage", "breeding", "refuge", "shelter", "rescue", "adoption",
  "petsitting", "pet-sitting", "pension", "toilettage", "grooming", "dressage", "training",
  "croquettes", "kibble", "petfood", "pet food", "accessoires animaux", "nac", "exotic",
  "hamster", "cochon d'inde", "guinea pig", "tortue", "turtle", "perroquet", "parrot",
  "insecte", "insect", "apiculture", "apiculteur", "abeille", "bee", "éthologie", "ethologie",
  "comportement animal", "animal behavior", "zoothérapie", "zootherapie",
];

function isAnimalRelated(fields: string[]): boolean {
  const text = fields.join(" ").toLowerCase();
  return ANIMAL_KEYWORDS.some((kw) => text.includes(kw));
}

interface Contact {
  name: string;
  position: string;
  profileUrl: string;
  platform: string;
}

interface BrandEntry {
  platform: string; // "LINKEDIN" | "INSTAGRAM" | "BOTH"
  rawName: string;
  handle?: string;
  profileUrl?: string;
  contacts: Contact[];
}

// Normalise un nom d'entreprise pour la déduplication
function normalizeCompany(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function parseLinkedIn(): Map<string, BrandEntry> {
  const brands = new Map<string, BrandEntry>();

  const csvPath = path.join(ROOT, "Complete_LinkedInDataExport_07-22-2026.zip", "Connections.csv");
  if (!fs.existsSync(csvPath)) return brands;

  const raw = fs.readFileSync(csvPath, "utf-8");
  const lines = raw.split("\n");
  const headerIdx = lines.findIndex((l) => l.startsWith("First Name"));
  if (headerIdx === -1) return brands;
  const csvContent = lines.slice(headerIdx).join("\n");

  const records = csvParse(csvContent, { columns: true, skip_empty_lines: true }) as Record<string, string>[];

  for (const r of records) {
    const company = (r["Company"] ?? "").trim();
    const position = (r["Position"] ?? "").trim();
    if (!company) continue;
    if (!isAnimalRelated([company, position])) continue;

    const key = normalizeCompany(company);
    const contact: Contact = {
      name: [r["First Name"], r["Last Name"]].filter(Boolean).join(" "),
      position,
      profileUrl: r["URL"] ?? "",
      platform: "LINKEDIN",
    };

    if (brands.has(key)) {
      brands.get(key)!.contacts.push(contact);
    } else {
      brands.set(key, {
        platform: "LINKEDIN",
        rawName: company,
        contacts: [contact],
      });
    }
  }

  return brands;
}

interface InstagramFollowingItem {
  title: string;
  string_list_data: { href: string; timestamp: number }[];
}

interface InstagramFollowerItem {
  string_list_data: { href: string; value: string; timestamp: number }[];
}

function parseInstagram(): Map<string, BrandEntry> {
  const brands = new Map<string, BrandEntry>();

  const followingPath = path.join(ROOT, "connections", "followers_and_following", "following.json");
  if (fs.existsSync(followingPath)) {
    const raw = JSON.parse(fs.readFileSync(followingPath, "utf-8")) as { relationships_following: InstagramFollowingItem[] };
    for (const item of raw.relationships_following ?? []) {
      const handle = item.title ?? "";
      const href = item.string_list_data?.[0]?.href ?? "";
      if (!handle || !isAnimalRelated([handle])) continue;
      const key = handle.toLowerCase();
      if (!brands.has(key)) {
        brands.set(key, { platform: "INSTAGRAM", rawName: handle, handle, profileUrl: href, contacts: [] });
      }
    }
  }

  const followersPath = path.join(ROOT, "connections", "followers_and_following", "followers_1.json");
  if (fs.existsSync(followersPath)) {
    const raw = JSON.parse(fs.readFileSync(followersPath, "utf-8")) as InstagramFollowerItem[];
    for (const item of raw ?? []) {
      const data = item.string_list_data?.[0];
      const handle = data?.value ?? "";
      const href = data?.href ?? "";
      if (!handle || !isAnimalRelated([handle])) continue;
      const key = handle.toLowerCase();
      if (!brands.has(key)) {
        brands.set(key, { platform: "INSTAGRAM", rawName: handle, handle, profileUrl: href, contacts: [] });
      }
    }
  }

  return brands;
}

// Tente de trouver si un nom LinkedIn correspond à un handle Instagram
function tryMatch(linkedinKey: string, instagramBrands: Map<string, BrandEntry>): string | null {
  for (const [igKey] of instagramBrands) {
    const igNorm = igKey.replace(/[^a-z0-9]/g, "");
    if (igNorm === linkedinKey || linkedinKey.includes(igNorm) || igNorm.includes(linkedinKey)) {
      return igKey;
    }
  }
  return null;
}

export async function POST() {
  try {
    const existing = await prisma.prospectImport.count();
    if (existing > 0) {
      return NextResponse.json(
        { error: "Import déjà effectué. Supprimez les prospects existants pour recommencer." },
        { status: 409 }
      );
    }

    const linkedinBrands = parseLinkedIn();
    const instagramBrands = parseInstagram();

    // Fusion : pour chaque marque LinkedIn, chercher un match Instagram
    const merged = new Map<string, BrandEntry>();

    for (const [key, entry] of linkedinBrands) {
      const igMatch = tryMatch(key, instagramBrands);
      if (igMatch) {
        const igEntry = instagramBrands.get(igMatch)!;
        merged.set(key, {
          platform: "BOTH",
          rawName: entry.rawName,
          handle: igEntry.handle,
          profileUrl: igEntry.profileUrl,
          contacts: entry.contacts,
        });
        instagramBrands.delete(igMatch);
      } else {
        merged.set(key, entry);
      }
    }

    // Ajouter les marques Instagram non matchées
    for (const [key, entry] of instagramBrands) {
      merged.set(`ig_${key}`, entry);
    }

    const data = Array.from(merged.values()).map((b) => ({
      platform: b.platform,
      rawName: b.rawName,
      handle: b.handle ?? null,
      profileUrl: b.profileUrl ?? null,
      contacts: b.contacts as object,
    }));

    await prisma.prospectImport.createMany({ data });

    const linkedinCount = Array.from(merged.values()).filter((b) => b.platform === "LINKEDIN" || b.platform === "BOTH").length;
    const instagramCount = Array.from(merged.values()).filter((b) => b.platform === "INSTAGRAM" || b.platform === "BOTH").length;

    return NextResponse.json({
      linkedin: linkedinCount,
      instagram: instagramCount,
      total: merged.size,
    });
  } catch (err) {
    console.error("[import/parse]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
