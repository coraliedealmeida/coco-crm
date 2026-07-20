"use client";

import { useState } from "react";
import Link from "next/link";
import { ServiceType } from "@prisma/client";
import { isProjectDone, projectLabel } from "@/lib/projects";
import { formatRevenue } from "@/lib/format";

type Project = {
  id: string;
  name: string | null;
  serviceType: ServiceType;
  currentStep: string;
  quoteAmount: number | null;
  signedAt: string | null;
  createdAt: string;
};

export default function ClientProjectsCard({
  clientId,
  brandId,
  projects,
  newProjectSlot,
}: {
  clientId: string;
  brandId: string;
  projects: Project[];
  newProjectSlot: React.ReactNode;
}) {
  const [showArchived, setShowArchived] = useState(false);

  const byRecency = (a: Project, b: Project) =>
    new Date(b.signedAt ?? b.createdAt).getTime() - new Date(a.signedAt ?? a.createdAt).getTime();

  const active = projects.filter((p) => !isProjectDone(p)).sort(byRecency);
  const archived = projects.filter(isProjectDone).sort(byRecency);

  return (
    <div className="rounded-3xl bg-white p-6 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-sans text-base font-extrabold text-ink">
          <span>📁</span> Projets
        </h2>
        <Link href={`/marques/${brandId}/notes`} className="text-sm font-semibold text-accent hover:underline">
          📋 Notes d&apos;appel découverte
        </Link>
      </div>

      {projects.length === 0 && <p className="mb-4 text-sm font-light text-ink/40">Aucun projet pour l&apos;instant.</p>}

      <div className="flex flex-col gap-2">
        {active.map((project) => (
          <ProjectRow key={project.id} clientId={clientId} project={project} />
        ))}

        {archived.length > 0 && (
          <>
            <button
              onClick={() => setShowArchived((v) => !v)}
              className="w-fit text-xs font-semibold text-ink/50 hover:text-accent hover:underline"
            >
              {showArchived ? "Réduire" : `Voir les projets terminés (${archived.length})`}
            </button>
            {showArchived && archived.map((project) => <ProjectRow key={project.id} clientId={clientId} project={project} />)}
          </>
        )}
      </div>

      <div className="mt-4">{newProjectSlot}</div>
    </div>
  );
}

function ProjectRow({ clientId, project }: { clientId: string; project: Project }) {
  return (
    <Link
      href={`/clients/${clientId}/projects/${project.id}`}
      className="flex items-center justify-between rounded-xl bg-soft px-4 py-3 transition hover:bg-accent-light/30"
    >
      <div>
        <p className="text-sm font-semibold text-ink">{projectLabel(project)}</p>
        <p className="text-xs font-light text-ink/50">{project.currentStep}</p>
      </div>
      <div className="flex items-center gap-3">
        {project.quoteAmount != null && (
          <span className="text-xs font-semibold text-ink/60">{formatRevenue(project.quoteAmount)}</span>
        )}
        {isProjectDone(project) && <span className="text-xs font-semibold text-accent">✅ Terminé</span>}
      </div>
    </Link>
  );
}
