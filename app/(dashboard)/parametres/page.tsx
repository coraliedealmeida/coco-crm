import { prisma } from "@/lib/prisma";
import SettingsForm from "@/components/SettingsForm";
import OptionsManager from "@/components/OptionsManager";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function ParametresPage() {
  const [settings, sectors, sources] = await Promise.all([
    prisma.settings.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } }),
    prisma.sectorOption.findMany({ orderBy: { label: "asc" } }),
    prisma.sourceOption.findMany({ orderBy: { label: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-sans text-3xl font-extrabold text-ink">Paramètres</h1>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SettingsForm
          initial={{
            daysBeforeGreenLight: settings.daysBeforeGreenLight,
            daysBeforeRelance1: settings.daysBeforeRelance1,
            daysBeforeRelance2: settings.daysBeforeRelance2,
            daysBeforeDevisRelance1: settings.daysBeforeDevisRelance1,
            daysBeforeDevisRelance2: settings.daysBeforeDevisRelance2,
            daysBeforeFactureRelance1: settings.daysBeforeFactureRelance1,
            daysBeforeFactureRelance2: settings.daysBeforeFactureRelance2,
            daysBetweenEngagements: settings.daysBetweenEngagements,
            emailNotifications: settings.emailNotifications,
          }}
        />
        <div className="flex flex-col gap-6">
          <OptionsManager title="Secteurs" endpoint="/api/options/sectors" initial={sectors} />
          <OptionsManager title="Sources" endpoint="/api/options/sources" initial={sources} />
        </div>
      </div>
      <Link
        href="/parametres/corbeille"
        className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-soft hover:shadow-softer"
      >
        <div>
          <h2 className="font-sans text-base font-extrabold text-ink">Corbeille</h2>
          <p className="text-sm font-light text-ink/60">
            Éléments supprimés (marques, projets, factures, demandes de devis) : rien n&apos;est effacé, tout se restaure.
          </p>
        </div>
        <span className="text-sm font-semibold text-accent">Ouvrir →</span>
      </Link>
      <LogoutButton />
    </div>
  );
}
