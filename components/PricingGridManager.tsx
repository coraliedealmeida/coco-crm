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
  content: string | null;
  active: boolean;
  order: number;
};

type BundleRow = {
  id: string;
  name: string;
  discountPercent: number;
  serviceIds: string[];
  description: string | null;
  active: boolean;
};

const priceTypeLabel: Record<PriceType, string> = { FIXED: "Fixe", HOURLY: "Horaire", MONTHLY: "Mensuel" };
const priceUnit: Record<PriceType, string> = { FIXED: "", HOURLY: "/h", MONTHLY: "/mois" };

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
  const [addingCategory, setAddingCategory] = useState("");
  const [bundleForm, setBundleForm] = useState<{
    name: string;
    discountPercent: string;
    serviceIds: string[];
    description: string;
  }>({
    name: "",
    discountPercent: "10",
    serviceIds: [],
    description: "",
  });
  const [error, setError] = useState("");

  const categories = Array.from(new Set(services.map((s) => s.category)));
  const categoryGroups = categories.map((category) => ({
    category,
    items: services.filter((s) => s.category === category),
  }));

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
    const category = addingCategory || newService.category;
    const price = Number(newService.price);
    if (!newService.name.trim() || !category.trim() || !price) return;
    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newService, category }),
    });
    const created = await res.json();
    setServices((prev) => [...prev, created]);
    setNewService(emptyNewService);
    setAddingCategory("");
    router.refresh();
  }

  async function handleAddBundle() {
    const discountPercent = Number(bundleForm.discountPercent);
    if (!bundleForm.name.trim() || bundleForm.serviceIds.length < 2) return;
    const res = await fetch("/api/bundles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: bundleForm.name,
        discountPercent,
        serviceIds: bundleForm.serviceIds,
        description: bundleForm.description,
      }),
    });
    const created = await res.json();
    setBundles((prev) => [...prev, created]);
    setBundleForm({ name: "", discountPercent: "10", serviceIds: [], description: "" });
    router.refresh();
  }

  async function updateBundle(id: string, data: Partial<BundleRow>) {
    setBundles((prev) => prev.map((b) => (b.id === id ? { ...b, ...data } : b)));
    await fetch(`/api/bundles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    router.refresh();
  }

  async function deleteBundle(id: string) {
    if (!confirm("Supprimer ce bundle ?")) return;
    await fetch(`/api/bundles/${id}`, { method: "DELETE" });
    setBundles((prev) => prev.filter((b) => b.id !== id));
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      {categoryGroups.map(({ category, items }) => (
        <div key={category} className="overflow-hidden rounded-3xl bg-white shadow-soft">
          <div className="bg-ink px-6 py-3">
            <h2 className="font-sans text-sm font-extrabold uppercase tracking-wide text-white">{category}</h2>
          </div>
          <div className="flex flex-col divide-y divide-soft">
            {items.map((s, i) => {
              const globalIndex = services.findIndex((sv) => sv.id === s.id);
              return (
                <div key={s.id} className={`flex gap-4 px-6 py-4 ${s.active ? "" : "opacity-40"}`}>
                  <div className="flex shrink-0 flex-col justify-center text-ink/20">
                    <button
                      onClick={() => moveService(s.id, -1)}
                      disabled={globalIndex === 0}
                      className="hover:text-ink disabled:opacity-0"
                      aria-label="Monter"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveService(s.id, 1)}
                      disabled={globalIndex === services.length - 1}
                      className="hover:text-ink disabled:opacity-0"
                      aria-label="Descendre"
                    >
                      ▼
                    </button>
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <input
                        value={s.name}
                        onChange={(e) => updateService(s.id, { name: e.target.value })}
                        className="min-w-[10rem] flex-1 rounded-lg border border-transparent bg-transparent py-1 font-sans text-base font-extrabold text-ink outline-none hover:border-accent-light focus:border-accent"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={s.price}
                          onChange={(e) => updateService(s.id, { price: Number(e.target.value) })}
                          className="w-24 rounded-lg border border-transparent bg-soft px-2 py-1 text-right font-sans text-base font-extrabold text-accent outline-none hover:border-accent-light focus:border-accent"
                        />
                        <select
                          value={s.priceType}
                          onChange={(e) => updateService(s.id, { priceType: e.target.value as PriceType })}
                          className="rounded-lg border border-transparent bg-transparent px-1 py-1 text-sm text-ink/60 outline-none hover:border-accent-light focus:border-accent"
                        >
                          {(Object.keys(priceTypeLabel) as PriceType[]).map((pt) => (
                            <option key={pt} value={pt}>
                              {priceTypeLabel[pt]}
                              {priceUnit[pt] && ` (${priceUnit[pt]})`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <textarea
                      value={s.content ?? ""}
                      onChange={(e) => updateService(s.id, { content: e.target.value })}
                      placeholder="Contenu inclus (une ligne par élément)"
                      rows={Math.max(2, (s.content ?? "").split("\n").length)}
                      className="mt-1 w-full resize-none rounded-lg border border-transparent bg-transparent py-1 text-sm font-light leading-relaxed text-ink/70 outline-none hover:border-accent-light focus:border-accent"
                    />

                    <div className="mt-2 flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-ink/50">
                        <input
                          type="checkbox"
                          checked={s.active}
                          onChange={(e) => updateService(s.id, { active: e.target.checked })}
                        />
                        Active
                      </label>
                      <button
                        onClick={() => deleteService(s.id)}
                        className="text-xs text-ink/40 hover:text-red-500"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h2 className="mb-4 font-sans text-base font-extrabold text-ink">Ajouter une prestation</h2>
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-48">
            <CreatableSelect
              label="Catégorie"
              options={categories}
              value={addingCategory}
              onChange={setAddingCategory}
              onCreate={async (v) => setAddingCategory(v)}
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

      <div className="overflow-hidden rounded-3xl bg-white shadow-soft">
        <div className="bg-ink px-6 py-3">
          <h2 className="font-sans text-sm font-extrabold uppercase tracking-wide text-white">Bundles</h2>
        </div>
        <div className="flex flex-col divide-y divide-soft">
          {bundles.map((b) => {
            const included = b.serviceIds.map((id) => services.find((s) => s.id === id)?.name).filter(Boolean);
            const base = b.serviceIds.reduce((sum, id) => sum + (services.find((s) => s.id === id)?.price ?? 0), 0);
            const bundlePrice = base * (1 - b.discountPercent / 100);
            return (
              <div key={b.id} className={`px-6 py-4 ${b.active ? "" : "opacity-40"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <input
                      value={b.name}
                      onChange={(e) => updateBundle(b.id, { name: e.target.value })}
                      className="rounded-lg border border-transparent bg-transparent py-1 font-sans text-base font-extrabold text-ink outline-none hover:border-accent-light focus:border-accent"
                    />
                    <p className="text-xs font-light text-ink/50">{included.join(" + ")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-ink/40 line-through">{formatPrice(base)}</span>
                    <span className="font-sans text-lg font-extrabold text-accent">{formatPrice(bundlePrice)}</span>
                    <div className="flex items-center gap-1 text-sm text-ink/60">
                      −
                      <input
                        type="number"
                        value={b.discountPercent}
                        onChange={(e) => updateBundle(b.id, { discountPercent: Number(e.target.value) })}
                        className="w-12 rounded-lg border border-transparent bg-soft px-1 py-1 text-center outline-none hover:border-accent-light focus:border-accent"
                      />
                      %
                    </div>
                    <button onClick={() => deleteBundle(b.id)} className="text-xs text-ink/40 hover:text-red-500">
                      Supprimer
                    </button>
                  </div>
                </div>
                <textarea
                  value={b.description ?? ""}
                  onChange={(e) => updateBundle(b.id, { description: e.target.value })}
                  placeholder="Description du bundle"
                  rows={2}
                  className="mt-2 w-full resize-none rounded-lg border border-transparent bg-transparent py-1 text-sm font-light leading-relaxed text-ink/70 outline-none hover:border-accent-light focus:border-accent"
                />
                <label className="mt-1 flex w-fit items-center gap-1.5 text-xs text-ink/50">
                  <input
                    type="checkbox"
                    checked={b.active}
                    onChange={(e) => updateBundle(b.id, { active: e.target.checked })}
                  />
                  Actif
                </label>
              </div>
            );
          })}
          {bundles.length === 0 && <p className="px-6 py-4 text-sm font-light text-ink/40">Aucun bundle.</p>}
        </div>

        <div className="flex flex-col gap-3 border-t border-soft px-6 py-5">
          <p className="font-sans text-sm font-extrabold text-ink">Créer un bundle</p>
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
          <textarea
            placeholder="Description (facultatif)"
            value={bundleForm.description}
            onChange={(e) => setBundleForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
            className="w-full rounded-xl border border-accent-light bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-accent"
          />
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
