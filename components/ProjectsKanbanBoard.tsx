"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { projectMacroGroups, macroGroupForStep, firstStepOfMacroGroup, resolveSteps, isProjectDone } from "@/lib/projects";
import ProjectCard, { ProjectCardData } from "@/components/ProjectCard";

type BoardProject = ProjectCardData & { steps: string[]; relance: 1 | 2 | null };

export default function ProjectsKanbanBoard({ projects: initialProjects }: { projects: BoardProject[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const router = useRouter();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function updateStep(projectId: string, currentStep: string) {
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, currentStep } : p)));
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentStep }),
    });
    router.refresh();
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const projectId = active.id as string;
    const targetGroupId = over.id as string;

    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const currentGroup = macroGroupForStep(project.currentStep);
    if (currentGroup === targetGroupId) return;

    const steps = resolveSteps(project.serviceType, project.steps);
    const nextStep = firstStepOfMacroGroup(steps, targetGroupId as (typeof projectMacroGroups)[number]["id"]);
    await updateStep(projectId, nextStep);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {projectMacroGroups.map((group) => {
          const groupProjects = projects
            .filter((p) => macroGroupForStep(p.currentStep) === group.id)
            .filter((p) => !isProjectDone(p));
          return (
            <Column
              key={group.id}
              group={group}
              visibleProjects={groupProjects}
              onStepChange={updateStep}
            />
          );
        })}
      </div>
    </DndContext>
  );
}

function Column({
  group,
  visibleProjects,
  onStepChange,
}: {
  group: { id: string; label: string; color: string };
  visibleProjects: BoardProject[];
  onStepChange: (projectId: string, step: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: group.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-80 shrink-0 flex-col gap-3 rounded-2xl p-3 transition ${
        isOver ? "bg-accent-light/30 ring-2 ring-accent" : "bg-soft/60"
      }`}
    >
      <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 shadow-softer">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: group.color }} />
        <h3 className="text-sm font-extrabold text-ink">{group.label}</h3>
        <span className="ml-auto rounded-full bg-soft px-2 py-0.5 text-xs font-semibold text-ink/50">
          {visibleProjects.length}
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {visibleProjects.map((p) => (
          <DraggableCard key={p.id} project={p} onStepChange={onStepChange} />
        ))}
        {visibleProjects.length === 0 && (
          <p className="px-1 text-xs font-light text-ink/30">⠿ Glisser ici</p>
        )}
      </div>
    </div>
  );
}

function DraggableCard({
  project,
  onStepChange,
}: {
  project: BoardProject;
  onStepChange: (projectId: string, step: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: project.id });
  const steps = resolveSteps(project.serviceType, project.steps);

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab ${isDragging ? "rotate-1 opacity-80" : ""}`}
    >
      <ProjectCard
        project={project}
        badge={
          project.relance && (
            <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-600">
              📮 Relance {project.relance}
            </span>
          )
        }
        statusContent={
          <select
            value={project.currentStep}
            onChange={(e) => onStepChange(project.id, e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full rounded-lg border border-accent-light bg-soft px-2.5 py-1.5 text-xs font-semibold text-ink outline-none focus:border-accent"
          >
            {steps.map((step) => (
              <option key={step} value={step}>
                {step}
              </option>
            ))}
          </select>
        }
      />
    </div>
  );
}
