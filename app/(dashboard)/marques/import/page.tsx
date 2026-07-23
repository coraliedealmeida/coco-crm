import { prisma } from "@/lib/prisma";
import ImportClient from "./ImportClient";
import BackButton from "@/components/BackButton";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const prospects = await prisma.prospectImport.findMany({
    orderBy: [{ brandCategory: "asc" }, { importedAt: "asc" }],
  });

  const total = prospects.length;
  const linkedin = prospects.filter((p) => p.platform === "LINKEDIN" || p.platform === "BOTH").length;
  const instagram = prospects.filter((p) => p.platform === "INSTAGRAM" || p.platform === "BOTH").length;
  const validated = prospects.filter((p) => p.status === "OUI").length;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <BackButton />
        <h1 className="mt-2 font-sans text-3xl font-extrabold text-ink">Import prospects</h1>
        <p className="font-light text-ink/60">LinkedIn · Instagram · Secteur animalier</p>
      </header>

      <ImportClient
        initialProspects={prospects.map((p) => ({
          id: p.id,
          platform: p.platform,
          rawName: p.rawName,
          handle: p.handle,
          profileUrl: p.profileUrl,
          contacts: (p.contacts ?? []) as { name: string; position: string; profileUrl: string; platform: string }[],
          brandCategory: p.brandCategory,
          status: p.status,
          scheduledDate: p.scheduledDate?.toISOString() ?? null,
          integratedAt: p.integratedAt?.toISOString() ?? null,
        }))}
        stats={{ total, linkedin, instagram, validated }}
      />
    </div>
  );
}
