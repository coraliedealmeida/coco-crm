import { prisma } from "@/lib/prisma";
import SettingsForm from "@/components/SettingsForm";
import OptionsManager from "@/components/OptionsManager";

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
        <p className="font-light text-ink/60">Ajuste les délais et les listes personnalisables.</p>
      </header>

      <div className="grid grid-cols-2 gap-6">
        <SettingsForm
          initial={{
            daysBeforeGreenLight: settings.daysBeforeGreenLight,
            daysBeforeRelance1: settings.daysBeforeRelance1,
            daysBeforeRelance2: settings.daysBeforeRelance2,
            emailNotifications: settings.emailNotifications,
          }}
        />
        <div className="flex flex-col gap-6">
          <OptionsManager
            title="Secteurs"
            endpoint="/api/options/sectors"
            initial={sectors.map((s) => s.label)}
          />
          <OptionsManager
            title="Sources"
            endpoint="/api/options/sources"
            initial={sources.map((s) => s.label)}
          />
        </div>
      </div>
    </div>
  );
}
