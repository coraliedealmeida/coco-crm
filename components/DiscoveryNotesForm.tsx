"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ServiceType } from "@prisma/client";
import { serviceTypeOptions } from "@/lib/serviceTypes";

type ServiceOption = {
  id: string;
  name: string;
  category: string;
  price: number;
  priceType: "FIXED" | "HOURLY" | "MONTHLY";
};

type BundleOption = {
  id: string;
  name: string;
  discountPercent: number;
  serviceIds: string[];
};

type NotesData = {
  summary: string;
  brandPresentation: string;
  visualSituation: string;
  mainObjective: string;
  serviceTypes: ServiceType[];
  elementsToKeep: string;
  visualReferences: string;
  existingSiteOrNew: string;
  pageCount: string;
  hasBlog: boolean;
  contentReady: boolean;
  contentReadyNotes: string;
  socialNetworks: string[];
  toolsUsed: string;
  whoUsesTemplates: string;
  recurringNeeds: string;
  currentOrganization: string;
  graphismeBrief: string;
  ecoleJuryModalites: string;
  desiredDelay: string;
  delayIfNotSpecified: string;
  paymentTermsPresented: boolean;
  clientQuestions: string;
  nextStepAgreed: string;
  selectedServiceIds: string[];
  serviceQuantities: Record<string, number>;
  selectedBundleIds: string[];
};

const emptyNotes: NotesData = {
  summary: "",
  brandPresentation: "",
  visualSituation: "",
  mainObjective: "",
  serviceTypes: [],
  elementsToKeep: "",
  visualReferences: "",
  existingSiteOrNew: "",
  pageCount: "",
  hasBlog: false,
  contentReady: false,
  contentReadyNotes: "",
  socialNetworks: [],
  toolsUsed: "",
  whoUsesTemplates: "",
  recurringNeeds: "",
  currentOrganization: "",
  graphismeBrief: "",
  ecoleJuryModalites: "",
  desiredDelay: "",
  delayIfNotSpecified: "",
  paymentTermsPresented: false,
  clientQuestions: "",
  nextStepAgreed: "",
  selectedServiceIds: [],
  serviceQuantities: {},
  selectedBundleIds: [],
};

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    amount
  );
}

export default function DiscoveryNotesForm({
  brandId,
  initial,
  services,
  bundles,
}: {
  brandId: string;
  initial: Partial<NotesData> | null;
  services: ServiceOption[];
  bundles: BundleOption[];
}) {
  const router = useRouter();
  const [notes, setNotes] = useState<NotesData>({ ...emptyNotes, ...initial });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof NotesData>(key: K, value: NotesData[K]) {
    setNotes((prev) => ({ ...prev, [key]: value }));
  }

  function toggleServiceType(type: ServiceType, checked: boolean) {
    set("serviceTypes", checked ? [...notes.serviceTypes, type] : notes.serviceTypes.filter((t) => t !== type));
  }

  const has = (type: ServiceType) => notes.serviceTypes.includes(type);

  // Services couverts par un bundle sélectionné = exclus du total individuel pour éviter le double comptage.
  const coveredServiceIds = new Set(
    bundles.filter((b) => notes.selectedBundleIds.includes(b.id)).flatMap((b) => b.serviceIds)
  );

  const bundleTotal = bundles
    .filter((b) => notes.selectedBundleIds.includes(b.id))
    .reduce((sum, b) => {
      const base = b.serviceIds.reduce((s, id) => s + (services.find((sv) => sv.id === id)?.price ?? 0), 0);
      return sum + base * (1 - b.discountPercent / 100);
    }, 0);

  const individualTotal = services
    .filter((s) => notes.selectedServiceIds.includes(s.id) && !coveredServiceIds.has(s.id))
    .reduce((sum, s) => {
      const qty = s.priceType === "HOURLY" ? notes.serviceQuantities[s.id] ?? 0 : 1;
      return sum + s.price * qty;
    }, 0);

  const totalHT = bundleTotal + individualTotal;
  const deposit30 = totalHT * 0.3;
  const threeInstallments = totalHT / 3;

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/brands/${brandId}/discovery-notes`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...notes, computedTotal: totalHT }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  let lastCategory = "";

  return (
    <div className="flex flex-col gap-6">
      <Section title="1. Accueil" icon="👋">
        <Field label="Résumé de l'échange">
          <Textarea value={notes.summary} onChange={(v) => set("summary", v)} />
        </Field>
      </Section>

      <Section title="2. Découverte client" icon="🔎">
        <Field label="Présentation de la marque et de l'activité">
          <Textarea value={notes.brandPresentation} onChange={(v) => set("brandPresentation", v)} />
        </Field>
        <Field label="Situation visuelle actuelle — identité existante ou création from scratch ?">
          <Textarea value={notes.visualSituation} onChange={(v) => set("visualSituation", v)} />
        </Field>
        <Field label="Objectif principal du projet">
          <Textarea value={notes.mainObjective} onChange={(v) => set("mainObjective", v)} />
        </Field>
      </Section>

      <Section title="3. Questions selon le(s) type(s) de prestation" icon="🎯">
        <Field label="Type(s) de prestation envisagé(s)">
          <div className="flex flex-wrap gap-3">
            {serviceTypeOptions.map((o) => (
              <label key={o.value} className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={has(o.value)}
                  onChange={(e) => toggleServiceType(o.value, e.target.checked)}
                />
                {o.label}
              </label>
            ))}
          </div>
        </Field>

        {(has("LA_PATTE") || has("LEMPREINTE")) && (
          <>
            <Field label="Éléments à conserver ou inclure">
              <Textarea value={notes.elementsToKeep} onChange={(v) => set("elementsToKeep", v)} />
            </Field>
            <Field label="Références visuelles et univers inspirants">
              <Textarea value={notes.visualReferences} onChange={(v) => set("visualReferences", v)} />
            </Field>
          </>
        )}

        {(has("SITE_ONE_PAGE") || has("SITE_VITRINE")) && (
          <>
            <Field label="Site existant ou création ?">
              <Textarea value={notes.existingSiteOrNew} onChange={(v) => set("existingSiteOrNew", v)} rows={2} />
            </Field>
            <Field label="Nombre de pages envisagé">
              <Textarea value={notes.pageCount} onChange={(v) => set("pageCount", v)} rows={1} />
            </Field>
            <CheckboxField label="Blog ou section actualités ?" checked={notes.hasBlog} onChange={(v) => set("hasBlog", v)} />
            <CheckboxField
              label="Contenus prêts (textes et photos) ?"
              checked={notes.contentReady}
              onChange={(v) => set("contentReady", v)}
            />
            <Field label="Notes sur les contenus">
              <Textarea value={notes.contentReadyNotes} onChange={(v) => set("contentReadyNotes", v)} rows={2} />
            </Field>
          </>
        )}

        {has("KIT_RS") && (
          <>
            <Field label="Réseaux concernés">
              <div className="flex gap-4">
                {["Instagram", "LinkedIn", "Facebook"].map((network) => (
                  <label key={network} className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={notes.socialNetworks.includes(network)}
                      onChange={(e) =>
                        set(
                          "socialNetworks",
                          e.target.checked
                            ? [...notes.socialNetworks, network]
                            : notes.socialNetworks.filter((n) => n !== network)
                        )
                      }
                    />
                    {network}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Outils utilisés (Canva, Adobe, autre ?)">
              <Textarea value={notes.toolsUsed} onChange={(v) => set("toolsUsed", v)} rows={2} />
            </Field>
            <Field label="Qui utilisera les templates ?">
              <Textarea value={notes.whoUsesTemplates} onChange={(v) => set("whoUsesTemplates", v)} rows={2} />
            </Field>
          </>
        )}

        {has("ACCOMPAGNEMENT_MENSUEL") && (
          <>
            <Field label="Besoins récurrents identifiés">
              <Textarea value={notes.recurringNeeds} onChange={(v) => set("recurringNeeds", v)} />
            </Field>
            <Field label="Organisation actuelle (équipe interne, prestataire, seul ?)">
              <Textarea value={notes.currentOrganization} onChange={(v) => set("currentOrganization", v)} />
            </Field>
            <Field label="Outils utilisés">
              <Textarea value={notes.toolsUsed} onChange={(v) => set("toolsUsed", v)} rows={2} />
            </Field>
          </>
        )}

        {has("GRAPHISME_A_LA_CARTE") && (
          <Field label="Brief du projet">
            <Textarea value={notes.graphismeBrief} onChange={(v) => set("graphismeBrief", v)} />
          </Field>
        )}

        {(has("ECOLES") || has("JURY")) && (
          <Field label="Modalités">
            <Textarea value={notes.ecoleJuryModalites} onChange={(v) => set("ecoleJuryModalites", v)} />
          </Field>
        )}
      </Section>

      <Section title="4. Process et conditions" icon="📋">
        <Field label="Délai souhaité si non précisé">
          <Textarea value={notes.delayIfNotSpecified} onChange={(v) => set("delayIfNotSpecified", v)} rows={2} />
        </Field>
        <CheckboxField
          label="Modalités de paiement présentées (30% acompte / 3x sans frais)"
          checked={notes.paymentTermsPresented}
          onChange={(v) => set("paymentTermsPresented", v)}
        />
        <Field label="Questions du client">
          <Textarea value={notes.clientQuestions} onChange={(v) => set("clientQuestions", v)} />
        </Field>
        <Field label="Prochaine étape convenue">
          <Textarea value={notes.nextStepAgreed} onChange={(v) => set("nextStepAgreed", v)} rows={2} />
        </Field>
      </Section>

      <Section title="5. Récapitulatif devis" icon="💰">
        <div className="flex flex-col gap-2">
          {services.map((s) => {
            const showCategory = s.category !== lastCategory;
            lastCategory = s.category;
            const covered = coveredServiceIds.has(s.id);
            return (
              <div key={s.id}>
                {showCategory && (
                  <p className="mb-1 mt-2 text-xs font-semibold uppercase tracking-wide text-ink/40">
                    {s.category}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <label className={`flex flex-1 items-center gap-2 text-sm ${covered ? "text-ink/30" : "text-ink"}`}>
                    <input
                      type="checkbox"
                      checked={notes.selectedServiceIds.includes(s.id)}
                      disabled={covered}
                      onChange={(e) =>
                        set(
                          "selectedServiceIds",
                          e.target.checked
                            ? [...notes.selectedServiceIds, s.id]
                            : notes.selectedServiceIds.filter((id) => id !== s.id)
                        )
                      }
                    />
                    {s.name} — {formatPrice(s.price)}
                    {s.priceType === "HOURLY" ? "/h" : s.priceType === "MONTHLY" ? "/mois" : ""}
                    {covered && " (inclus dans le bundle)"}
                  </label>
                  {s.priceType === "HOURLY" && notes.selectedServiceIds.includes(s.id) && !covered && (
                    <input
                      type="number"
                      min={0}
                      value={notes.serviceQuantities[s.id] ?? 0}
                      onChange={(e) =>
                        set("serviceQuantities", { ...notes.serviceQuantities, [s.id]: Number(e.target.value) })
                      }
                      placeholder="h"
                      className="w-20 rounded-lg border border-accent-light bg-soft px-2 py-1 text-sm text-ink outline-none focus:border-accent"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {bundles.length > 0 && (
          <Field label="Bundles (remplacent les prestations individuelles couvertes)">
            <div className="flex flex-col gap-2">
              {bundles.map((b) => {
                const base = b.serviceIds.reduce(
                  (s, id) => s + (services.find((sv) => sv.id === id)?.price ?? 0),
                  0
                );
                const bundlePrice = base * (1 - b.discountPercent / 100);
                return (
                  <label key={b.id} className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={notes.selectedBundleIds.includes(b.id)}
                      onChange={(e) =>
                        set(
                          "selectedBundleIds",
                          e.target.checked
                            ? [...notes.selectedBundleIds, b.id]
                            : notes.selectedBundleIds.filter((id) => id !== b.id)
                        )
                      }
                    />
                    {b.name} — {formatPrice(bundlePrice)} (−{b.discountPercent}%)
                  </label>
                );
              })}
            </div>
          </Field>
        )}

        <div className="grid grid-cols-3 gap-4">
          <RecapTile label="Total HT" value={formatPrice(totalHT)} accent="#8B5CF6" />
          <RecapTile label="Acompte 30%" value={formatPrice(deposit30)} accent="#C4B5FD" />
          <RecapTile label="3x sans frais" value={`${formatPrice(threeInstallments)} × 3`} accent="#CCFF00" />
        </div>
      </Section>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-fit rounded-xl bg-cta px-6 py-3 font-semibold text-ink transition hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Enregistrement..." : saved ? "Enregistré ✓" : "Enregistrer les notes"}
      </button>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-soft">
      <h2 className="mb-4 flex items-center gap-2 font-sans text-base font-extrabold text-ink">
        <span>{icon}</span> {title}
      </h2>
      <div className="flex flex-col gap-4">{children}</div>
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

function Textarea({
  value,
  onChange,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="w-full rounded-xl border border-accent-light bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-accent"
    />
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-semibold text-ink">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function RecapTile({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="overflow-hidden rounded-xl bg-soft">
      <div className="h-1" style={{ backgroundColor: accent }} />
      <div className="px-4 py-3">
        <p className="text-xs font-light text-ink/50">{label}</p>
        <p className="mt-1 text-base font-extrabold text-ink">{value}</p>
      </div>
    </div>
  );
}
