import Link from "next/link";
import { serviceTypeLabel } from "@/lib/serviceTypes";
import { avatarColor, initials } from "@/lib/pipeline";
import { formatRevenue } from "@/lib/format";

export type ProjectCardData = {
  id: string;
  clientId: string;
  brandName: string;
  brandEmoji: string | null;
  serviceType: keyof typeof serviceTypeLabel;
  currentStep: string;
  quoteAmount: number | null;
  estimatedDeliveryDate: string | null;
};

export default function ProjectCard({
  project,
  statusContent,
  badge,
}: {
  project: ProjectCardData;
  statusContent: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-md transition hover:shadow-lg">
      <div className="mb-3 flex items-center gap-3">
        {project.brandEmoji ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-soft text-lg">
            {project.brandEmoji}
          </div>
        ) : (
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white"
            style={{ backgroundColor: avatarColor(project.brandName) }}
          >
            {initials(project.brandName)}
          </div>
        )}
        <div className="flex-1 truncate">
          <Link
            href={`/clients/${project.clientId}/projects/${project.id}`}
            className="block truncate text-sm font-extrabold text-ink hover:underline"
          >
            {project.brandName}
          </Link>
          <p className="truncate text-xs font-light text-ink/50">{serviceTypeLabel[project.serviceType]}</p>
        </div>
        {badge}
      </div>

      <div className="mb-2.5">{statusContent}</div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {project.quoteAmount != null && (
          <span className="rounded-full bg-cta/30 px-2.5 py-1 text-xs font-semibold text-ink">
            💰 {formatRevenue(project.quoteAmount)}
          </span>
        )}
        {project.estimatedDeliveryDate && (
          <span className="rounded-full bg-soft px-2.5 py-1 text-xs font-semibold text-ink/70">
            📅 {new Date(project.estimatedDeliveryDate).toLocaleDateString("fr-FR")}
          </span>
        )}
      </div>
    </div>
  );
}
