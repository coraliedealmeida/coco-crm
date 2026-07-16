"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ServiceType } from "@prisma/client";
import { resolveSteps, insertCustomStep, removeStep, isCustomStep } from "@/lib/projects";

type Project = {
  id: string;
  clientId: string;
  serviceType: ServiceType;
  currentStep: string;
  steps: string[];
  startDate: string | null;
  estimatedDeliveryDate: string | null;
  quoteAmount: number | null;
  invoicedAt: string | null;
  paidAt: string | null;
  notes: string;
};

function toDateInputValue(iso: string | null): string {
  return iso ? new Date(iso).toISOString().slice(0, 10) : "";
}

function formatRevenue(amount: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    amount
  );
}

export default function ProjectForm({ initial }: { initial: Project }) {
  const router = useRouter();
  const [project, setProject] = useState(initial);
  const [newStep, setNewStep] = useState("");
  const [deleting, setDeleting] = useState(false);

  const steps = resolveSteps(project.serviceType, project.steps);

  async function update(data: Partial<Project>) {
    setProject((prev) => ({ ...prev, ...data }));
    await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    router.refresh();
  }

  async function handleAddStep() {
    const label = newStep.trim();
    if (!label || steps.includes(label)) return;
    const nextSteps = insertCustomStep(project.serviceType, project.steps, label);
    setNewStep("");
    await update({ steps: nextSteps });
  }

  async function handleRemoveStep(label: string) {
    const nextSteps = removeStep(project.serviceType, project.steps, label);
    const nextCurrent = project.currentStep === label ? nextSteps[0] : project.currentStep;
    await update({ steps: nextSteps, currentStep: nextCurrent });
  }

  async function handleDelete() {
    if (!confirm("Supprimer ce projet ? Cette action est irréversible.")) return;
    setDeleting(true);
    await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    router.push(`/clients/${project.clientId}`);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Bandeau d'en-tête : données clés du projet */}
      <div className="grid grid-cols-3 gap-4">
        <HeaderTile label="Statut en cours" value={project.currentStep} accent="#8B5CF6" />
        <HeaderTile
          label="Date de livraison"
          value={
            project.estimatedDeliveryDate
              ? new Date(project.estimatedDeliveryDate).toLocaleDateString("fr-FR")
              : "Non renseignée"
          }
          accent="#C4B5FD"
        />
        <HeaderTile
          label="Montant du devis"
          value={project.quoteAmount != null ? formatRevenue(project.quoteAmount) : "Non renseigné"}
          accent="#CCFF00"
        />
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h2 className="mb-4 font-sans text-base font-extrabold text-ink">Étapes</h2>
        <div className="flex flex-wrap gap-2">
          {steps.map((step) => {
            const currentIndex = steps.indexOf(project.currentStep);
            const stepIndex = steps.indexOf(step);
            const reached = stepIndex <= currentIndex;
            const custom = isCustomStep(project.serviceType, step);
            return (
              <span key={step} className="group relative inline-flex items-center">
                <button
                  onClick={() => update({ currentStep: step })}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    step === project.currentStep
                      ? "bg-accent text-white shadow-soft"
                      : reached
                        ? "bg-accent-light/40 text-ink"
                        : "bg-soft text-ink/50 hover:bg-accent-light/20"
                  }`}
                >
                  {step}
                </button>
                {custom && (
                  <button
                    onClick={() => handleRemoveStep(step)}
                    aria-label={`Supprimer le statut ${step}`}
                    className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white group-hover:flex"
                  >
                    ×
                  </button>
                )}
              </span>
            );
          })}
        </div>

        <div className="mt-4 flex gap-2 border-t border-soft pt-4">
          <input
            value={newStep}
            onChange={(e) => setNewStep(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddStep()}
            placeholder="Ajouter un statut personnalisé (ex : Révision 2)"
            className="flex-1 rounded-xl border border-accent-light bg-soft px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
          />
          <button
            onClick={handleAddStep}
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Ajouter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 className="mb-4 font-sans text-base font-extrabold text-ink">Informations</h2>
          <div className="flex flex-col gap-4">
            <Field label="Date de début">
              <input
                type="date"
                value={toDateInputValue(project.startDate)}
                onChange={(e) => update({ startDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                className="w-full rounded-xl border border-accent-light bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-accent"
              />
            </Field>

            <Field label="Date de livraison estimée">
              <input
                type="date"
                value={toDateInputValue(project.estimatedDeliveryDate)}
                onChange={(e) =>
                  update({ estimatedDeliveryDate: e.target.value ? new Date(e.target.value).toISOString() : null })
                }
                className="w-full rounded-xl border border-accent-light bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-accent"
              />
            </Field>

            {project.serviceType === "ACCOMPAGNEMENT_MENSUEL" && <MonthlyCycle startDate={project.startDate} />}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 className="mb-4 font-sans text-base font-extrabold text-ink">Facturation</h2>
          <div className="flex flex-col gap-4">
            <Field label="Montant du devis HT">
              <input
                type="number"
                value={project.quoteAmount ?? ""}
                onChange={(e) => update({ quoteAmount: e.target.value ? Number(e.target.value) : null })}
                className="w-full rounded-xl border border-accent-light bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-accent"
              />
            </Field>

            {(project.invoicedAt || project.paidAt) && (
              <div className="flex flex-col gap-1 text-sm font-light text-ink/60">
                {project.invoicedAt && (
                  <p>Facture envoyée le {new Date(project.invoicedAt).toLocaleDateString("fr-FR")}</p>
                )}
                {project.paidAt && <p>Payée le {new Date(project.paidAt).toLocaleDateString("fr-FR")}</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h2 className="mb-4 font-sans text-base font-extrabold text-ink">Notes générales</h2>
        <textarea
          value={project.notes}
          onChange={(e) => update({ notes: e.target.value })}
          rows={4}
          className="w-full rounded-xl border border-accent-light bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-accent"
        />
      </div>

      <button
        onClick={handleDelete}
        disabled={deleting}
        className="w-fit text-sm text-ink/40 hover:text-red-500 disabled:opacity-50"
      >
        Supprimer ce projet
      </button>
    </div>
  );
}

function HeaderTile({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-soft">
      <div className="h-1.5" style={{ backgroundColor: accent }} />
      <div className="p-5">
        <p className="text-xs font-light text-ink/50">{label}</p>
        <p
          className="mt-1 font-sans text-lg font-extrabold leading-tight"
          style={{ color: accent === "#CCFF00" ? "#1D1C1F" : accent }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function MonthlyCycle({ startDate }: { startDate: string | null }) {
  if (!startDate) {
    return (
      <p className="text-xs font-light text-ink/40">
        Renseigne la date de début pour afficher le cycle mensuel (1/3 — 2/3 — 3/3).
      </p>
    );
  }
  const start = new Date(startDate);
  const now = new Date();
  const monthsElapsed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  const position = (((monthsElapsed % 3) + 3) % 3) + 1;

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-ink">Cycle mensuel</p>
      <div className="flex gap-2">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold ${
              n === position ? "bg-cta text-ink" : "bg-soft text-ink/40"
            }`}
          >
            {n}/3
          </span>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-ink">{label}</label>
      {children}
    </div>
  );
}
