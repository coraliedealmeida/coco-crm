"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GROUP_ORDER, groupFor } from "@/lib/serviceGroups";
import { formatRevenue as formatPrice } from "@/lib/format";

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

const emptyNewService = { name: "", category: GROUP_ORDER[0], price: "", priceType: "FIXED" as PriceType, content: "" };

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
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [showInactive, setShowInactive] = useState<Set<string>>(new Set());
  const [newService, setNewService] = useState(emptyNewService);
  const [showAddService, setShowAddService] = useState(false);
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
  const [showAddBundle, setShowAddBundle] = useState(false);
  const [error, setError] = useState("");

  function toggleGroup(title: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  function toggleInactive(key: string) {
    setShowInactive((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Actives en premier, désactivées repliées derrière un lien "Voir X offres désactivées"
  // — pour ne pas polluer visuellement la grille avec des offres retirées de la vente.
  const groups = GROUP_ORDER.map((title) => {
    const items = services.filter((s) => groupFor(s) === title);
    return {
      title,
      active: items.filter((s) => s.active),
      inactive: items.filter((s) => !s.active),
    };
  });

  const activeBundles = bundles.filter((b) => b.active);
  const inactiveBundles = bundles.filter((b) => !b.active);

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

  async function handleAddService() {
    const price = Number(newService.price);
    if (!newService.name.trim() || !price) return;
    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newService),
    });
    const created = await res.json();
    setServices((prev) => [...prev, created]);
    setNewService(emptyNewService);
    setShowAddService(false);
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
    setShowAddBundle(false);
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
    <div className="flex flex-col gap-4">
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      {groups.map(
        ({ title, active, inactive }) =>
          active.length + inactive.length > 0 && (
            <AccordionSection
              key={title}
              title={title}
              count={active.length + inactive.length}
              open={openGroups.has(title)}
              onToggle={() => toggleGroup(title)}
            >
              <ColumnHeaders />
              <div className="flex flex-col divide-y divide-soft">
                {active.map((s) => (
                  <ServiceRowEditor
                    key={s.id}
                    service={s}
                    onUpdate={(data) => updateService(s.id, data)}
                    onDelete={() => deleteService(s.id)}
                  />
                ))}
              </div>
              {inactive.length > 0 && (
                <div className="border-t border-soft">
                  <button
                    onClick={() => toggleInactive(title)}
                    className="w-full px-6 py-3 text-left text-xs font-semibold text-ink/50 hover:text-accent"
                  >
                    {showInactive.has(title)
                      ? "Réduire"
                      : `Voir les offres désactivées (${inactive.length})`}
                  </button>
                  {showInactive.has(title) && (
                    <div className="flex flex-col divide-y divide-soft border-t border-soft">
                      {inactive.map((s) => (
                        <ServiceRowEditor
                          key={s.id}
                          service={s}
                          onUpdate={(data) => updateService(s.id, data)}
                          onDelete={() => deleteService(s.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </AccordionSection>
          )
      )}

      <AccordionSection
        title="Bundles"
        count={bundles.length}
        open={openGroups.has("Bundles")}
        onToggle={() => toggleGroup("Bundles")}
      >
        <div className="flex flex-col divide-y divide-soft">
          {activeBundles.map((b) => (
            <BundleRowEditor
              key={b.id}
              bundle={b}
              services={services}
              onUpdate={(data) => updateBundle(b.id, data)}
              onDelete={() => deleteBundle(b.id)}
            />
          ))}
          {activeBundles.length === 0 && inactiveBundles.length === 0 && (
            <p className="px-6 py-4 text-sm font-light text-ink/40">Aucun bundle.</p>
          )}
        </div>
        {inactiveBundles.length > 0 && (
          <div className="border-t border-soft">
            <button
              onClick={() => toggleInactive("Bundles")}
              className="w-full px-6 py-3 text-left text-xs font-semibold text-ink/50 hover:text-accent"
            >
              {showInactive.has("Bundles")
                ? "Réduire"
                : `Voir les bundles désactivés (${inactiveBundles.length})`}
            </button>
            {showInactive.has("Bundles") && (
              <div className="flex flex-col divide-y divide-soft border-t border-soft">
                {inactiveBundles.map((b) => (
                  <BundleRowEditor
                    key={b.id}
                    bundle={b}
                    services={services}
                    onUpdate={(data) => updateBundle(b.id, data)}
                    onDelete={() => deleteBundle(b.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </AccordionSection>

      <div className="mt-2 flex flex-col gap-3 text-sm">
        {showAddService ? (
          <div className="rounded-2xl bg-soft/60 p-5">
            <div className="flex flex-wrap items-end gap-2">
              <select
                value={newService.category}
                onChange={(e) => setNewService((s) => ({ ...s, category: e.target.value }))}
                className="rounded-xl border border-accent-light bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
              >
                {GROUP_ORDER.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <input
                placeholder="Nom de la prestation"
                value={newService.name}
                onChange={(e) => setNewService((s) => ({ ...s, name: e.target.value }))}
                className="flex-1 rounded-xl border border-accent-light bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
              />
              <input
                type="number"
                placeholder="Prix"
                value={newService.price}
                onChange={(e) => setNewService((s) => ({ ...s, price: e.target.value }))}
                className="w-28 rounded-xl border border-accent-light bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
              />
              <select
                value={newService.priceType}
                onChange={(e) => setNewService((s) => ({ ...s, priceType: e.target.value as PriceType }))}
                className="rounded-xl border border-accent-light bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
              >
                {(Object.keys(priceTypeLabel) as PriceType[]).map((pt) => (
                  <option key={pt} value={pt}>
                    {priceTypeLabel[pt]}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              placeholder="Contenu inclus (une ligne par élément)"
              value={newService.content}
              onChange={(e) => setNewService((s) => ({ ...s, content: e.target.value }))}
              rows={2}
              className="mt-2 w-full rounded-xl border border-accent-light bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
            />
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleAddService}
                className="rounded-xl bg-cta px-5 py-2.5 text-sm font-semibold text-ink transition hover:opacity-90"
              >
                Ajouter
              </button>
              <button
                onClick={() => setShowAddService(false)}
                className="rounded-xl px-4 py-2.5 text-sm text-ink/50 hover:text-ink"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddService(true)}
            className="w-fit text-ink/40 underline-offset-2 hover:text-accent hover:underline"
          >
            + Ajouter une prestation
          </button>
        )}

        {showAddBundle ? (
          <div className="rounded-2xl bg-soft/60 p-5">
            <div className="flex flex-wrap gap-2">
              <input
                placeholder="Nom du bundle"
                value={bundleForm.name}
                onChange={(e) => setBundleForm((f) => ({ ...f, name: e.target.value }))}
                className="flex-1 rounded-xl border border-accent-light bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
              />
              <input
                type="number"
                placeholder="Remise %"
                value={bundleForm.discountPercent}
                onChange={(e) => setBundleForm((f) => ({ ...f, discountPercent: e.target.value }))}
                className="w-28 rounded-xl border border-accent-light bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
              />
            </div>
            <textarea
              placeholder="Description (facultatif)"
              value={bundleForm.description}
              onChange={(e) => setBundleForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="mt-2 w-full rounded-xl border border-accent-light bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
            />
            <div className="mt-3 flex flex-wrap gap-3">
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
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleAddBundle}
                className="rounded-xl bg-cta px-5 py-2.5 text-sm font-semibold text-ink transition hover:opacity-90"
              >
                Créer le bundle
              </button>
              <button
                onClick={() => setShowAddBundle(false)}
                className="rounded-xl px-4 py-2.5 text-sm text-ink/50 hover:text-ink"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddBundle(true)}
            className="w-fit text-ink/40 underline-offset-2 hover:text-accent hover:underline"
          >
            + Ajouter un bundle
          </button>
        )}
      </div>
    </div>
  );
}

function AccordionSection({
  title,
  count,
  open,
  onToggle,
  children,
}: {
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-soft">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-soft"
      >
        <span className="flex items-center gap-2 font-sans text-base font-extrabold text-ink">
          {title}
          <span className="rounded-full bg-soft px-2 py-0.5 text-xs font-semibold text-accent">{count}</span>
        </span>
        <span className={`text-accent transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open && <div className="border-t border-soft">{children}</div>}
    </div>
  );
}

function BundleRowEditor({
  bundle,
  services,
  onUpdate,
  onDelete,
}: {
  bundle: BundleRow;
  services: ServiceRow[];
  onUpdate: (data: Partial<BundleRow>) => void;
  onDelete: () => void;
}) {
  const included = bundle.serviceIds.map((id) => services.find((s) => s.id === id)?.name).filter(Boolean);
  const base = bundle.serviceIds.reduce((sum, id) => sum + (services.find((s) => s.id === id)?.price ?? 0), 0);
  const bundlePrice = base * (1 - bundle.discountPercent / 100);
  return (
    <div className={`grid grid-cols-1 gap-3 px-6 py-4 sm:grid-cols-[1fr_2fr_140px] sm:gap-4 ${bundle.active ? "" : "opacity-40"}`}>
      <div>
        <input
          value={bundle.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="w-full rounded-lg border border-transparent bg-transparent py-1 font-sans text-sm font-extrabold text-ink outline-none hover:border-accent-light focus:border-accent"
        />
        <p className="mt-0.5 text-xs font-light text-ink/50">{included.join(" + ")}</p>
      </div>
      <textarea
        value={bundle.description ?? ""}
        onChange={(e) => onUpdate({ description: e.target.value })}
        placeholder="Description du bundle"
        rows={2}
        className="w-full resize-none rounded-lg border border-transparent bg-transparent py-1 text-sm font-light leading-relaxed text-ink/70 outline-none hover:border-accent-light focus:border-accent"
      />
      <div className="flex flex-col items-start gap-1 sm:items-end">
        <span className="text-xs text-ink/40 line-through">{formatPrice(base)}</span>
        <span className="font-sans text-base font-extrabold text-accent">{formatPrice(bundlePrice)}</span>
        <div className="flex items-center gap-1 text-xs text-ink/60">
          −
          <input
            type="number"
            value={bundle.discountPercent}
            onChange={(e) => onUpdate({ discountPercent: Number(e.target.value) })}
            className="w-10 rounded-lg border border-transparent bg-soft px-1 py-0.5 text-center outline-none hover:border-accent-light focus:border-accent"
          />
          %
        </div>
        <div className="flex items-center gap-2 text-xs text-ink/40">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={bundle.active} onChange={(e) => onUpdate({ active: e.target.checked })} />
            Active
          </label>
          <button onClick={onDelete} className="hover:text-red-500">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

function ColumnHeaders() {
  return (
    <div className="hidden gap-4 px-6 pt-3 sm:grid sm:grid-cols-[1fr_2fr_140px] text-xs font-semibold uppercase tracking-wide text-ink/40">
      <span>Offre</span>
      <span>Contenu inclus</span>
      <span className="text-right">Tarif HT</span>
    </div>
  );
}

function ServiceRowEditor({
  service,
  onUpdate,
  onDelete,
}: {
  service: ServiceRow;
  onUpdate: (data: Partial<ServiceRow>) => void;
  onDelete: () => void;
}) {
  return (
    <div className={`grid grid-cols-1 gap-3 px-6 py-4 sm:grid-cols-[1fr_2fr_140px] sm:gap-4 ${service.active ? "" : "opacity-40"}`}>
      <input
        value={service.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        className="w-full rounded-lg border border-transparent bg-transparent py-1 font-sans text-sm font-extrabold text-ink outline-none hover:border-accent-light focus:border-accent"
      />

      <textarea
        value={service.content ?? ""}
        onChange={(e) => onUpdate({ content: e.target.value })}
        placeholder="Contenu inclus (une ligne par élément)"
        rows={Math.max(2, (service.content ?? "").split("\n").length)}
        className="w-full resize-none rounded-lg border border-transparent bg-transparent py-1 text-sm font-light leading-relaxed text-ink/70 outline-none hover:border-accent-light focus:border-accent"
      />

      <div className="flex flex-col items-start gap-1 sm:items-end">
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={service.price}
            onChange={(e) => onUpdate({ price: Number(e.target.value) })}
            className="w-20 rounded-lg border border-transparent bg-soft px-2 py-1 text-right font-sans text-sm font-extrabold text-accent outline-none hover:border-accent-light focus:border-accent"
          />
        </div>
        <select
          value={service.priceType}
          onChange={(e) => onUpdate({ priceType: e.target.value as PriceType })}
          className="rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-right text-xs text-ink/50 outline-none hover:border-accent-light focus:border-accent"
        >
          {(Object.keys(priceTypeLabel) as PriceType[]).map((pt) => (
            <option key={pt} value={pt}>
              {priceTypeLabel[pt]}
              {priceUnit[pt] && ` (${priceUnit[pt]})`}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2 text-xs text-ink/40">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={service.active} onChange={(e) => onUpdate({ active: e.target.checked })} />
            Active
          </label>
          <button onClick={onDelete} className="hover:text-red-500">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
