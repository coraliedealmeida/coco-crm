"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectPaymentStatus, ServiceType } from "@prisma/client";
import { paymentStatusOptions } from "@/lib/projects";

type Project = {
  id: string;
  clientId: string;
  serviceType: ServiceType;
  currentStep: string;
  revisionCount: number;
  startDate: string | null;
  estimatedDeliveryDate: string | null;
  quoteAmount: number | null;
  paymentStatus: ProjectPaymentStatus;
  notes: string;
};

function toDateInputValue(iso: string | null): string {
  return iso ? new Date(iso).toISOString().slice(0, 10) : "";
}

export default function ProjectForm({ initial, steps }: { initial: Project; steps: string[] }) {
  const router = useRouter();
  const [project, setProject] = useState(initial);
  const [deleting, setDeleting] = useState(false);

  async function update(data: Partial<Project>) {
    setProject((prev) => ({ ...prev, ...data }));
    await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    router.refresh();
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
      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h2 className="mb-4 font-sans text-base font-extrabold text-ink">Étapes</h2>
        <div className="flex flex-wrap gap-2">
          {steps.map((step) => {
            const currentIndex = steps.indexOf(project.currentStep);
            const stepIndex = steps.indexOf(step);
            const reached = stepIndex <= currentIndex;
            return (
              <button
                key={step}
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
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 className="mb-4 font-sans text-base font-extrabold text-ink">Informations</h2>
          <div className="flex flex-col gap-4">
            <Field label="Nombre de révisions">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => update({ revisionCount: Math.max(0, project.revisionCount - 1) })}
                  className="h-9 w-9 rounded-lg bg-soft text-ink hover:bg-accent-light/40"
                >
                  −
                </button>
                <span className="w-8 text-center font-sans text-lg font-extrabold text-ink">
                  {project.revisionCount}
                </span>
                <button
                  onClick={() => update({ revisionCount: project.revisionCount + 1 })}
                  className="h-9 w-9 rounded-lg bg-soft text-ink hover:bg-accent-light/40"
                >
                  +
                </button>
              </div>
            </Field>

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

            {project.serviceType === "ACCOMPAGNEMENT_MENSUEL" && (
              <MonthlyCycle startDate={project.startDate} />
            )}
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

            <Field label="Statut de paiement">
              <select
                value={project.paymentStatus}
                onChange={(e) => update({ paymentStatus: e.target.value as ProjectPaymentStatus })}
                className="w-full rounded-xl border border-accent-light bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-accent"
              >
                {paymentStatusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h2 className="mb-4 font-sans text-base font-extrabold text-ink">Notes</h2>
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
