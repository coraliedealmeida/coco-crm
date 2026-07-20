import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { serviceTypeLabel } from "@/lib/serviceTypes";
import { projectLabel } from "@/lib/projects";
import ProjectForm from "@/components/ProjectForm";
import ProjectNotesPanel from "@/components/ProjectNotesPanel";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: { id: string; projectId: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.projectId },
    include: {
      client: { include: { brand: true } },
      trackingNotes: { orderBy: { date: "desc" } },
      invoices: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!project || project.clientId !== params.id) notFound();

  const suivi = (
    <div className="rounded-3xl bg-white p-6 shadow-soft">
      <h2 className="mb-4 flex items-center gap-2 font-sans text-base font-extrabold text-ink">
        <span>🗓️</span> Suivi du projet
      </h2>
      <ProjectNotesPanel
        projectId={project.id}
        notes={project.trackingNotes.map((n) => ({
          id: n.id,
          date: n.date.toISOString(),
          content: n.content,
        }))}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href={`/marques/${project.client.brand.id}?from=projets`}
          className="text-sm font-semibold text-accent hover:underline"
        >
          ← Retour à {project.client.brand.name}
        </Link>
        <h1 className="mt-2 font-sans text-3xl font-extrabold text-ink">{projectLabel(project)}</h1>
        <p className="font-light text-ink/60">
          {project.client.brand.name}
          {project.name && ` · ${serviceTypeLabel[project.serviceType]}`}
        </p>
      </header>

      <ProjectForm
        suiviSlot={suivi}
        initial={{
          id: project.id,
          clientId: project.clientId,
          serviceType: project.serviceType,
          name: project.name,
          currentStep: project.currentStep,
          steps: project.steps,
          signedAt: project.signedAt ? project.signedAt.toISOString() : null,
          startDate: project.startDate ? project.startDate.toISOString() : null,
          estimatedDeliveryDate: project.estimatedDeliveryDate ? project.estimatedDeliveryDate.toISOString() : null,
          quoteAmount: project.quoteAmount,
          invoices: project.invoices.map((i) => ({
            id: i.id,
            label: i.label,
            amount: i.amount,
            sentAt: i.sentAt ? i.sentAt.toISOString() : null,
            paidAt: i.paidAt ? i.paidAt.toISOString() : null,
          })),
        }}
      />
    </div>
  );
}
