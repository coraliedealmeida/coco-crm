"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CreatableSelect from "@/components/CreatableSelect";

type PriceType = "FIXED" | "HOURLY" | "MONTHLY";

type ServiceRow = {
  id: string;
  name: string;
  category: string;
  price: number;
  priceType: PriceType;
  active: boolean;
  order: number;
};

type BundleRow = {
  id: string;
  name: string;
  discountPercent: number;
  serviceIds: string[];
  active: boolean;
};

const priceTypeLabel: Record<PriceType, string> = { FIXED: "Fixe", HOURLY: "Horaire", MONTHLY: "Mensuel" };

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    amount
  );
}

const emptyNewService = { name: "", category: "", price: "", priceType: "FIXED" as PriceType };

export default function PricingGridManager({
  initialServices,
  initialBundles,
}: {
  initialServices: ServiceRow[];
  initialBundles: BundleRow[];
}) {
  const router = useRouter();
  const [services, setServices] = useState(initialServices);
  const [bundles, setBundles] = useState(initialBundles);
  const [newService, setNewService] = useState(emptyNewService);
  const [bundleForm, setBundleForm] = useState<{ name: string; discountPercent: string; serviceIds: string[] }>({
    name: "",
    discountPercent: "10",
    serviceIds: [],
  });
  const [error, setError] = useState("");

  const categories = Array.from(new Set(services.map((s) => s.category)));

  async function updateService(id: string, data: Partial<ServiceRow>) {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
    await fetch(`/api/services/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    router.refresh();
  }

  async function deleteService(id: string) {
    if (!confirm("Supprimer cette prestation ?")) return;
    const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Suppression impossible.");
      return;
    }
    setError("");
    setServices((prev) => prev.filter((s) => s.id !== id));
    router.refresh();
  }

  async function moveService(id: string, direction: -1 | 1) {
    const index = services.findIndex((s) => s.id === id);
    const target = services[index + direction];
    if (!target) return;
    const current = services[index];
    const reordered = [...services];
    reordered[index] = { ...current, order: target.order };
    reordered[index + direction] = { ...target, order: current.order };
    reordered.sort((a, b) => a.order - b.order);
    setServices(reordered);
    await Promise.all([
      fetch(`/api/services/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: target.order }),
      }),
      fetch(`/api/services/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: current.order }),
      }),
    ]);
    router.refresh();
  }

  async function handleAddService() {
    const price = Number(newService.price);
    if (!newService.name.trim() || !newService.category.trim() || !price) return;
    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newService, price }),
    });
    const created = await res.json();
    setServices((prev) => [...prev, created]);
    setNewService(emptyNewService);
    router.refresh();
  }

  async function handleAddBundle() {
    const discountPercent = Number(bundleForm.discountPercent);
    if (!bundleForm.name.trim() || bundleForm.serviceIds.length < 2) return;
    const res = await fetch("/api/bundles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: bundleForm.name, discountPercent, serviceIds: bundleForm.serviceIds }),
    });
    const created = await res.json();
    setBundles((prev) => [...prev, created]);
    setBundleForm({ name: "", discountPercent: "10", serviceIds: [] });
    router.refresh();
  }

  async function deleteBundle(id: string) {
    if (!confirm("Supprimer ce bundle ?")) return;
    await fetch(`/api/bundles/${id}`, { method: "DELETE" });
    setBundles((prev) => prev.filter((b) => b.id !== id));
    router.refresh();
  }

  let lastCategory = "";

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h2 className="mb-4 font-sans text-base font-extrabold text-ink">Prestations</h2>
        <div className="flex flex-col gap-1">
          {services.map((s, i) => {
            const showCategory = s.category !== lastCategory;
            lastCategory = s.category;
            return (
              <div key={s.id}>
                {showCategory && (
                  <p className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wide text-ink/40">{s.category}</p>
                )}
                <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${s.active ? "" : "opacity-40"}`}>
                  <div className="flex flex-col">
                    <button
                      onClick={() => moveService(s.id, -1)}
                      disabled={i === 0}
                      className="text-ink/30 hover:text-ink disabled:opacity-0"
                      aria-label="Monter"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveService(s.id, 1)}
                      disabled={i === services.length - 1}
                      className="text-ink/30 hover:text-ink disabled:opacity-0"
                      aria-label="Descendre"
                    >
                      ▼
                    </button>
                  </div>
                  <input
                    value={s.name}
                    onChange={(e) => updateService(s.id, { name: e.target.value })}
                    className="flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm text-ink outline-none hover:border-accent-light focus:border-accent"
                  />
                  <input
                    type="number"
                    value={s.price}
                    onChange={(e) => updateService(s.id, { price: Number(e.target.value) })}
                    className="w-24 rounded-lg border border-transparent bg-transparent px-2 py-1 text-right text-sm text-ink outline-none hover:border-accent-light focus:border-accent"
                  />
                  <select
                    value={s.priceType}
                    onChange={(e) => updateService(s.id, { priceType: e.target.value as PriceType })}
                    className="rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm text-ink outline-none hover:border-accent-light focus:border-accent"
                  >
                    {(Object.keys(priceTypeLabel) as PriceType[]).map((pt) => (
                      <option key={pt} value={pt}>
                        {priceTypeLabel[pt]}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1.5 text-xs text-ink/50">
                    <input
                      type="checkbox"
                      checked={s.active}
                      onChange={(e) => updateService(s.id, { active: e.target.checked })}
                    />
                    Active
                  </label>
                  <button onClick={() => deleteService(s.id)} className="text-ink/30 hover:text-red-500" aria-label="Supprimer">
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-end gap-2 border-t border-soft pt-5">
          <div className="w-48">
            <CreatableSelect
              label="Catégorie"
              options={categories}
              value={newService.category}
              onChange={(v) => setNewService((s) => ({ ...s, category: v }))}
              onCreate={async () => {}}
            />
          </div>
          <input
            placeholder="Nom de la prestation"
            value={newService.name}
            onChange={(e) => setNewService((s) => ({ ...s, name: e.target.value }))}
            className="flex-1 rounded-xl border border-accent-light bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-accent"
          />
          <input
            type="number"
            placeholder="Prix"
            value={newService.price}
            onChange={(e) => setNewService((s) => ({ ...s, price: e.target.value }))}
            className="w-28 rounded-xl border border-accent-light bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-accent"
          />
          <select
            value={newService.priceType}
            onChange={(e) => setNewService((s) => ({ ...s, priceType: e.target.value as PriceType }))}
            className="rounded-xl border border-accent-light bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-accent"
          >
            {(Object.keys(priceTypeLabel) as PriceType[]).map((pt) => (
              <option key={pt} value={pt}>
                {priceTypeLabel[pt]}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddService}
            className="rounded-xl bg-cta px-5 py-3 text-sm font-semibold text-ink transition hover:opacity-90"
          >
            Ajouter
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h2 className="mb-4 font-sans text-base font-extrabold text-ink">Bundles</h2>
        <div className="flex flex-col gap-2">
          {bundles.map((b) => {
            const included = b.serviceIds.map((id) => services.find((s) => s.id === id)?.name).filter(Boolean);
            const base = b.serviceIds.reduce((sum, id) => sum + (services.find((s) => s.id === id)?.price ?? 0), 0);
            const bundlePrice = base * (1 - b.discountPercent / 100);
            return (
              <div key={b.id} className="flex items-center justify-between rounded-xl bg-soft px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {b.name} — {formatPrice(bundlePrice)} (−{b.discountPercent}%)
                  </p>
                  <p className="text-xs font-light text-ink/50">{included.join(" + ")}</p>
                </div>
                <button onClick={() => deleteBundle(b.id)} className="text-ink/30 hover:text-red-500" aria-label="Supprimer">
                  ×
                </button>
              </div>
            );
          })}
          {bundles.length === 0 && <p className="text-sm font-light text-ink/40">Aucun bundle.</p>}
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-soft pt-5">
          <div className="flex flex-wrap gap-2">
            <input
              placeholder="Nom du bundle"
              value={bundleForm.name}
              onChange={(e) => setBundleForm((f) => ({ ...f, name: e.target.value }))}
              className="flex-1 rounded-xl border border-accent-light bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-accent"
            />
            <input
              type="number"
              placeholder="Remise %"
              value={bundleForm.discountPercent}
              onChange={(e) => setBundleForm((f) => ({ ...f, discountPercent: e.target.value }))}
              className="w-28 rounded-xl border border-accent-light bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-accent"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            {services.map((s) => (
              <label key={s.id} className="flex items-center gap-1.5 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={bundleForm.serviceIds.includes(s.id)}
                  onChange={(e) =>
                    setBundleForm((f) => ({
                      ...f,
                      serviceIds: e.target.checked
                        ? [...f.serviceIds, s.id]
                        : f.serviceIds.filter((id) => id !== s.id),
                    }))
                  }
                />
                {s.name}
              </label>
            ))}
          </div>
          <button
            onClick={handleAddBundle}
            className="w-fit rounded-xl bg-cta px-5 py-3 text-sm font-semibold text-ink transition hover:opacity-90"
          >
            Créer le bundle
          </button>
        </div>
      </div>
    </div>
  );
}
