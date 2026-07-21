"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PipelineStatus, ServiceType } from "@prisma/client";
import { serviceTypeOptions, serviceTypeLabel } from "@/lib/serviceTypes";
import { statusLabel, statusColor } from "@/lib/pipeline";
import { quoteRequestStatuses, isQuoteRequestClosed } from "@/lib/quoteRequests";
import { formatRevenue } from "@/lib/format";

type QuoteRequest = {
  id: string;
  label: string | null;
  serviceTypes: ServiceType[];
  status: PipelineStatus;
  potentialRevenue: number | null;
  lastContactDate: string | null;
};

function toDateInputValue(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export default function QuoteRequestsCard({
  clientId,
  quoteRequests: initial,
}: {
  clientId: string;
  quoteRequests: QuoteRequest[];
}) {
  const router = useRouter();
  const [quoteRequests, setQuoteRequests] = useState(initial);
  const [showClosed, setShowClosed] = useState(false);
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [potentialRevenue, setPotentialRevenue] = useState("");
  const [saving, setSaving] = useState(false);

  const openRequests = quoteRequests.filter((q) => !isQuoteRequestClosed(q.status));
  const closed = quoteRequests.filter((q) => isQuoteRequestClosed(q.status));

  function toggleServiceType(type: ServiceType, checked: boolean) {
    setServiceTypes((prev) => (checked ? [...prev, type] : prev.filter((t) => t !== type)));
  }

  async function handleStatusChange(id: string, status: PipelineStatus) {
    setQuoteRequests((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)));
    await fetch(`/api/quote-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function handleDateChange(id: string, isoDate: string) {
    setQuoteRequests((prev) => prev.map((q) => (q.id === id ? { ...q, lastContactDate: isoDate } : q)));
    await fetch(`/api/quote-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lastContactDate: isoDate }),
    });
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette demande de devis ?")) return;
    setQuoteRequests((prev) => prev.filter((q) => q.id !== id));
    await fetch(`/api/quote-requests/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function handleCreate() {
    setSaving(true);
    const res = await fetch(`/api/clients/${clientId}/quote-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label,
        serviceTypes,
        potentialRevenue: potentialRevenue ? Number(potentialRevenue) : null,
      }),
    });
    const created = await res.json();
    setQuoteRequests((prev) => [...prev, created]);
    setSaving(false);
    setOpen(false);
    setLabel("");
    setServiceTypes([]);
    setPotentialRevenue("");
    router.refresh();
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-soft">
      <h2 className="mb-4 flex items-center gap-2 font-sans text-base font-extrabold text-ink">
        <span>📋</span> Demandes de devis
      </h2>

      {quoteRequests.length === 0 && (
        <p className="mb-4 text-sm font-light text-ink/40">
          Pour une nouvelle demande de ce client (en parallèle des projets déjà en cours) : elle apparaîtra dans le
          Pipeline avec ses propres relances.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {openRequests.map((q) => (
          <QuoteRequestRow
            key={q.id}
            q={q}
            onStatusChange={handleStatusChange}
            onDateChange={handleDateChange}
            onDelete={handleDelete}
          />
        ))}

        {closed.length > 0 && (
          <>
            <button
              onClick={() => setShowClosed((v) => !v)}
              className="w-fit text-xs font-semibold text-ink/50 hover:text-accent hover:underline"
            >
              {showClosed ? "Réduire" : `Voir les devis clôturés (${closed.length})`}
            </button>
            {showClosed &&
              closed.map((q) => (
                <QuoteRequestRow
                  key={q.id}
                  q={q}
                  onStatusChange={handleStatusChange}
                  onDateChange={handleDateChange}
                  onDelete={handleDelete}
                />
              ))}
          </>
        )}
      </div>

      <div className="mt-4">
        {!open ? (
          <button
            onClick={() => setOpen(true)}
            className="w-fit rounded-xl bg-cta px-5 py-3 text-sm font-semibold text-ink transition hover:opacity-90"
          >
            + Nouvelle demande de devis
          </button>
        ) : (
          <div className="flex flex-col gap-3 rounded-2xl bg-soft/60 p-4">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Nom de la demande (optionnel, ex : Refonte identité 2026)"
              className="rounded-xl border border-accent-light bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
            />
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-ink">
              {serviceTypeOptions.map((o) => (
                <label key={o.value} className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={serviceTypes.includes(o.value)}
                    onChange={(e) => toggleServiceType(o.value, e.target.checked)}
                  />
                  {o.label}
                </label>
              ))}
            </div>
            <input
              type="number"
              value={potentialRevenue}
              onChange={(e) => setPotentialRevenue(e.target.value)}
              placeholder="Montant potentiel (optionnel)"
              className="w-48 rounded-xl border border-accent-light bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreate}
                disabled={saving}
                className="rounded-xl bg-cta px-5 py-3 text-sm font-semibold text-ink transition hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Création..." : "Créer la demande"}
              </button>
              <button onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-sm text-ink/50 hover:text-ink">
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function QuoteRequestRow({
  q,
  onStatusChange,
  onDateChange,
  onDelete,
}: {
  q: QuoteRequest;
  onStatusChange: (id: string, status: PipelineStatus) => void;
  onDateChange: (id: string, isoDate: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editingDate, setEditingDate] = useState(false);
  const title = q.label || q.serviceTypes.map((t) => serviceTypeLabel[t]).join(", ") || "Demande de devis";

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-soft px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        {q.potentialRevenue != null && (
          <p className="text-xs font-light text-ink/50">{formatRevenue(q.potentialRevenue)}</p>
        )}
        {q.lastContactDate &&
          (editingDate ? (
            <input
              type="date"
              autoFocus
              defaultValue={toDateInputValue(q.lastContactDate)}
              onBlur={() => setEditingDate(false)}
              onChange={(e) => {
                if (!e.target.value) return;
                setEditingDate(false);
                onDateChange(q.id, new Date(e.target.value).toISOString());
              }}
              className="mt-1 rounded-lg border border-accent-light bg-white px-2 py-1 text-xs text-ink outline-none focus:border-accent"
            />
          ) : (
            <button
              onClick={() => setEditingDate(true)}
              title="Modifier la date"
              className="text-xs font-light text-ink/40 underline-offset-2 hover:underline"
            >
              Dernier contact : {new Date(q.lastContactDate).toLocaleDateString("fr-FR")}
            </button>
          ))}
      </div>
      <div className="flex items-center gap-2">
        <select
          value={q.status}
          onChange={(e) => onStatusChange(q.id, e.target.value as PipelineStatus)}
          className="rounded-lg border border-accent-light bg-white px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-accent"
          style={{ color: statusColor(q.status) }}
        >
          {quoteRequestStatuses.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
        <button onClick={() => onDelete(q.id)} className="text-ink/30 hover:text-red-500" aria-label="Supprimer">
          ×
        </button>
      </div>
    </div>
  );
}
