"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ServiceType } from "@prisma/client";
import { serviceTypeOptions } from "@/lib/serviceTypes";

type ServiceOption = { id: string; name: string; price: number; priceType: "FIXED" | "HOURLY" | "MONTHLY" };

type NotesData = {
  summary: string;
  brandPresentation: string;
  visualSituation: string;
  mainObjective: string;
  serviceType: ServiceType | "";
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
  desiredDelay: string;
  delayIfNotSpecified: string;
  paymentTermsPresented: boolean;
  clientQuestions: string;
  nextStepAgreed: string;
  serviceIds: string[];
};

const emptyNotes: NotesData = {
  summary: "",
  brandPresentation: "",
  visualSituation: "",
  mainObjective: "",
  serviceType: "",
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
  desiredDelay: "",
  delayIfNotSpecified: "",
  paymentTermsPresented: false,
  clientQuestions: "",
  nextStepAgreed: "",
  serviceIds: [],
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
}: {
  brandId: string;
  initial: Partial<NotesData> | null;
  services: ServiceOption[];
}) {
  const router = useRouter();
  const [notes, setNotes] = useState<NotesData>({ ...emptyNotes, ...initial });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof NotesData>(key: K, value: NotesData[K]) {
    setNotes((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/brands/${brandId}/discovery-notes`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notes),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  const selectedServices = services.filter((s) => notes.serviceIds.includes(s.id));
  const totalHT = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const deposit30 = totalHT * 0.3;
  const threeInstallments = totalHT / 3;

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

      <Section title="3. Questions selon le type de prestation" icon="🎯">
        <Field label="Type de prestation">
          <select
            value={notes.serviceType}
            onChange={(e) => set("serviceType", e.target.value as ServiceType)}
            className="w-full rounded-xl border border-accent-light bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-accent"
          >
            <option value="">Choisir...</option>
            {serviceTypeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        {(notes.serviceType === "LA_PATTE" || notes.serviceType === "LEMPREINTE") && (
          <>
            <Field label="Éléments à conserver ou inclure">
              <Textarea value={notes.elementsToKeep} onChange={(v) => set("elementsToKeep", v)} />
            </Field>
            <Field label="Références visuelles et univers inspirants">
              <Textarea value={notes.visualReferences} onChange={(v) => set("visualReferences", v)} />
            </Field>
            <Field label="Délai souhaité">
              <Textarea value={notes.desiredDelay} onChange={(v) => set("desiredDelay", v)} rows={2} />
            </Field>
          </>
        )}

        {(notes.serviceType === "SITE_ONE_PAGE" || notes.serviceType === "SITE_VITRINE") && (
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
            <Field label="Délai souhaité">
              <Textarea value={notes.desiredDelay} onChange={(v) => set("desiredDelay", v)} rows={2} />
            </Field>
          </>
        )}

        {notes.serviceType === "KIT_RS" && (
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
            <Field label="Délai souhaité">
              <Textarea value={notes.desiredDelay} onChange={(v) => set("desiredDelay", v)} rows={2} />
            </Field>
          </>
        )}

        {notes.serviceType === "ACCOMPAGNEMENT_MENSUEL" && (
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
        <Field label="Prestations identifiées">
          <div className="flex flex-col gap-2">
            {services.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={notes.serviceIds.includes(s.id)}
                  onChange={(e) =>
                    set(
                      "serviceIds",
                      e.target.checked
                        ? [...notes.serviceIds, s.id]
                        : notes.serviceIds.filter((id) => id !== s.id)
                    )
                  }
                />
                {s.name} — {formatPrice(s.price)}
                {s.priceType === "HOURLY" ? "/h" : s.priceType === "MONTHLY" ? "/mois" : ""}
              </label>
            ))}
          </div>
        </Field>

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
