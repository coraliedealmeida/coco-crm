import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { serviceTypeLabel, projectSteps } from "@/lib/serviceTypes";
import ProjectForm from "@/components/ProjectForm";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: { id: string; projectId: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.projectId },
    include: { client: { include: { brand: true } } },
  });

  if (!project || project.clientId !== params.id) notFound();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href={`/clients/${project.clientId}`} className="text-sm font-semibold text-accent hover:underline">
          ← Retour à {project.client.brand.name}
        </Link>
        <h1 className="mt-2 font-sans text-3xl font-extrabold text-ink">{serviceTypeLabel[project.serviceType]}</h1>
        <p className="font-light text-ink/60">{project.client.brand.name}</p>
      </header>

      <ProjectForm
        initial={{
          id: project.id,
          clientId: project.clientId,
          serviceType: project.serviceType,
          currentStep: project.currentStep,
          revisionCount: project.revisionCount,
          startDate: project.startDate ? project.startDate.toISOString() : null,
          estimatedDeliveryDate: project.estimatedDeliveryDate ? project.estimatedDeliveryDate.toISOString() : null,
          quoteAmount: project.quoteAmount,
          invoicedAt: project.invoicedAt ? project.invoicedAt.toISOString() : null,
          paidAt: project.paidAt ? project.paidAt.toISOString() : null,
          notes: project.notes ?? "",
        }}
        steps={projectSteps[project.serviceType]}
      />
    </div>
  );
}
