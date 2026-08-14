import { prisma } from "@/lib/prisma";
import SettingsForm from "@/components/SettingsForm";
import OptionsManager from "@/components/OptionsManager";
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
      <LogoutButton />
    </div>
  );
}
