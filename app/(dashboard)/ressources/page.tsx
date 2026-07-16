import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PricingGridManager from "@/components/PricingGridManager";
import MessagesTemplates from "@/components/MessagesTemplates";

export const dynamic = "force-dynamic";

const tabs = [
  { id: "offres", label: "Offres" },
  { id: "messages", label: "Messages types" },
];

export default async function RessourcesPage({ searchParams }: { searchParams: { tab?: string } }) {
  const activeTab = searchParams.tab === "messages" ? "messages" : "offres";

  const [services, bundles] =
    activeTab === "offres"
      ? await Promise.all([
          prisma.service.findMany({ orderBy: { order: "asc" } }),
          prisma.bundle.findMany({ orderBy: { createdAt: "asc" } }),
        ])
      : [[], []];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-sans text-3xl font-extrabold text-ink">Ressources</h1>
      </header>

      <div className="flex w-fit gap-1 rounded-2xl bg-white p-1.5 shadow-soft">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/ressources?tab=${t.id}`}
            scroll={false}
            className={`rounded-xl px-6 py-2.5 text-sm font-semibold transition ${
              activeTab === t.id ? "bg-accent text-white" : "text-ink/60 hover:bg-soft"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {activeTab === "offres" ? (
        <PricingGridManager initialServices={services} initialBundles={bundles} />
      ) : (
        <MessagesTemplates />
      )}
    </div>
  );
}
