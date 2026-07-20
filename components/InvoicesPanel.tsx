"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { invoicedTotal, paidTotal, remainingToInvoice } from "@/lib/projects";

type Invoice = { id: string; label: string; amount: number; sentAt: string | null; paidAt: string | null };

function toDateInputValue(iso: string | null): string {
  return iso ? new Date(iso).toISOString().slice(0, 10) : "";
}

function formatRevenue(amount: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    amount
  );
}

export default function InvoicesPanel({
  projectId,
  quoteAmount,
  invoices: initialInvoices,
}: {
  projectId: string;
  quoteAmount: number | null;
  invoices: Invoice[];
}) {
  const router = useRouter();
  const [invoices, setInvoices] = useState(initialInvoices);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const asDates = invoices.map((i) => ({
    amount: i.amount,
    sentAt: i.sentAt ? new Date(i.sentAt) : null,
    paidAt: i.paidAt ? new Date(i.paidAt) : null,
  }));
  const remaining = remainingToInvoice(quoteAmount, asDates);

  async function update(id: string, data: Partial<Invoice>) {
    setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, ...data } : i)));
    await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    router.refresh();
  }

  async function handleAdd() {
    const amount = Number(newAmount);
    if (!newLabel.trim() || !amount) return;
    const res = await fetch(`/api/projects/${projectId}/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newLabel, amount }),
    });
    const created = await res.json();
    setInvoices((prev) => [...prev, created]);
    setNewLabel("");
    setNewAmount("");
    setAdding(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette facture ?")) return;
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    setInvoices((prev) => prev.filter((i) => i.id !== id));
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-4 text-sm">
        <span className="font-light text-ink/50">
          Facturé <span className="font-semibold text-ink">{formatRevenue(invoicedTotal(asDates))}</span>
        </span>
        <span className="font-light text-ink/50">
          Encaissé <span className="font-semibold text-ink">{formatRevenue(paidTotal(asDates))}</span>
        </span>
        {quoteAmount != null && (
          <span className="font-light text-ink/50">
            Reste à facturer{" "}
            <span className="font-semibold text-ink">{formatRevenue(remaining)}</span>
          </span>
        )}
      </div>

      {invoices.length > 0 && (
        <div className="flex flex-col gap-2">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="rounded-xl bg-soft px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <input
                  value={invoice.label}
                  onChange={(e) => update(invoice.id, { label: e.target.value })}
                  className="min-w-[8rem] flex-1 rounded-lg border border-transparent bg-transparent py-1 text-sm font-semibold text-ink outline-none hover:border-accent-light focus:border-accent"
                />
                <input
                  type="number"
                  value={invoice.amount}
                  onChange={(e) => update(invoice.id, { amount: Number(e.target.value) })}
                  className="w-24 rounded-lg border border-transparent bg-white px-2 py-1 text-right text-sm font-semibold text-accent outline-none hover:border-accent-light focus:border-accent"
                />
                <button onClick={() => handleDelete(invoice.id)} className="text-ink/30 hover:text-red-500" aria-label="Supprimer">
                  ×
                </button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-light text-ink/50">Facturée le</span>
                  <input
                    type="date"
                    value={toDateInputValue(invoice.sentAt)}
                    onChange={(e) =>
                      update(invoice.id, { sentAt: e.target.value ? new Date(e.target.value).toISOString() : null })
                    }
                    className="rounded-lg border border-accent-light bg-white px-2 py-1.5 text-xs text-ink outline-none focus:border-accent"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-light text-ink/50">Payée le</span>
                  <input
                    type="date"
                    value={toDateInputValue(invoice.paidAt)}
                    onChange={(e) =>
                      update(invoice.id, { paidAt: e.target.value ? new Date(e.target.value).toISOString() : null })
                    }
                    className="rounded-lg border border-accent-light bg-white px-2 py-1.5 text-xs text-ink outline-none focus:border-accent"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="flex flex-wrap items-end gap-2 rounded-xl bg-soft/60 p-3">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Libellé (ex : Acompte, Facture 2/3...)"
            className="flex-1 rounded-lg border border-accent-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
          <input
            type="number"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            placeholder="Montant"
            className="w-28 rounded-lg border border-accent-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
          <button
            onClick={handleAdd}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Ajouter
          </button>
          <button onClick={() => setAdding(false)} className="px-2 py-2 text-sm text-ink/50 hover:text-ink">
            Annuler
          </button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="w-fit text-sm font-semibold text-accent hover:underline">
          + Ajouter une facture
        </button>
      )}
    </div>
  );
}
