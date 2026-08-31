"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const actionTypes = [
  "Premier contact",
  "Relance 1",
  "Relance 2",
  "Réponse reçue",
  "Appel découverte",
  "Appel réalisé",
  "Devis envoyé",
  "Relance devis 1",
  "Relance devis 2",
  "Devis refusé",
  "Note",
];

function addMonths(date: Date, months: number): string {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export default function BrandActions({ brandId }: { brandId: string }) {
  const router = useRouter();
  const [type, setType] = useState(actionTypes[0]);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [showPausModal, setShowPauseModal] = useState(false);
  const [pauseDate, setPauseDate] = useState("");

  async function handlePause() {
    if (!pauseDate) return;
    setSaving(true);
    await fetch(`/api/brands/${brandId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pipelineStatus: "PAS_MAINTENANT", reconsiderDate: pauseDate }),
    });
    setSaving(false);
    setShowPauseModal(false);
    setPauseDate("");
    router.refresh();
  }

  async function handleLog() {
    setSaving(true);
    await fetch(`/api/brands/${brandId}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, content }),
    });
    setSaving(false);
    setContent("");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Supprimer cette fiche prospect ? Cette action est irréversible.")) return;
    setDeleting(true);
    setDeleteError("");

    let res = await fetch(`/api/brands/${brandId}`, { method: "DELETE" });

    if (res.status === 409) {
      const data = await res.json();
      if (data.hasClient) {
        const detail = [
          data.projectCount > 0 ? `${data.projectCount} projet(s)` : null,
          data.invoiceCount > 0 ? `${data.invoiceCount} facture(s)` : null,
        ]
          .filter(Boolean)
          .join(" et ");
        const warning = detail
          ? `Cette marque a un client avec ${detail}. Tout sera supprimé définitivement, y compris l'historique de facturation. Confirmer la suppression ?`
          : "Cette marque a un client associé (sans projet). Le client sera aussi supprimé. Confirmer ?";
        if (!confirm(warning)) {
          setDeleting(false);
          return;
        }
        res = await fetch(`/api/brands/${brandId}?force=true`, { method: "DELETE" });
      }
    }

    if (!res.ok) {
      const data = await res.json();
      setDeleteError(data.error ?? "Suppression impossible.");
      setDeleting(false);
      return;
    }
    router.push("/marques");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h2 className="mb-4 flex items-center gap-2 font-sans text-base font-extrabold text-ink">
          <span>💬</span> Commentaires
        </h2>
        <div className="flex flex-col gap-3">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-xl border border-accent-light bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-accent"
          >
            {actionTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Note ou message envoyé (optionnel)"
            rows={3}
            className="w-full rounded-xl border border-accent-light bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-accent"
          />
          <button
            onClick={handleLog}
            disabled={saving}
            className="w-fit rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>

      {/* Pas maintenant */}
      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h2 className="mb-4 flex items-center gap-2 font-sans text-base font-extrabold text-ink">
          <span>⏸</span> Pas maintenant
        </h2>
        {!showPausModal ? (
          <div>
            <p className="mb-4 text-sm text-ink/50">Mettre cette marque en pause et recevoir un rappel à une date choisie.</p>
            <button
              onClick={() => setShowPauseModal(true)}
              className="rounded-xl bg-soft px-4 py-2.5 text-sm font-semibold text-ink/70 transition hover:bg-accent-light/30 hover:text-ink"
            >
              Fixer une date de rappel →
            </button>
          </div>
        ) : (
          <div>
            <p className="mb-3 text-sm font-semibold text-ink">Rappel dans combien de temps ?</p>
            <div className="mb-3 flex flex-wrap gap-2">
              {[
                { label: "3 mois", months: 3 },
                { label: "6 mois", months: 6 },
                { label: "1 an", months: 12 },
              ].map(({ label, months }) => (
                <button
                  key={months}
                  onClick={() => setPauseDate(addMonths(new Date(), months))}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    pauseDate === addMonths(new Date(), months)
                      ? "bg-accent text-white"
                      : "bg-soft text-ink hover:bg-accent-light/30"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mb-5 flex items-center gap-2">
              <span className="text-xs font-light text-ink/50">Ou choisir une date :</span>
              <input
                type="date"
                value={pauseDate}
                onChange={(e) => setPauseDate(e.target.value)}
                className="rounded-xl border border-accent-light bg-soft px-3 py-1.5 text-sm text-ink outline-none focus:border-accent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePause}
                disabled={saving || !pauseDate}
                className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Enregistrement..." : "Confirmer"}
              </button>
              <button
                onClick={() => { setShowPauseModal(false); setPauseDate(""); }}
                className="rounded-xl bg-soft px-5 py-2.5 text-sm font-semibold text-ink/50 hover:text-ink"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {deleteError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{deleteError}</p>}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="w-fit text-sm text-ink/40 hover:text-red-500 disabled:opacity-50"
      >
        Supprimer cette fiche prospect
      </button>
    </div>
  );
}
