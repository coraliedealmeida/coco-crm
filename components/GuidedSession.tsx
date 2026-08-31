"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { messageTemplates } from "@/lib/messages";
import { platformBadge, brandProfileLink } from "@/lib/pipeline";
import ProfileLink from "@/components/ProfileLink";
import type { PipelineStatus } from "@prisma/client";
import { bestProfileLink, type QualificationProspect } from "@/lib/prospectImport";

export type EngagementContact = {
  index: number;
  contact: { name: string; position: string; profileUrl: string; platform: string };
};

/** Canal utilisé pour une action de prospection. LINKEDIN/INSTAGRAM = DM sur le réseau ;
 * EMAIL/FORMULAIRE = hors réseaux sociaux, mais tracé de la même façon dans le Suivi. */
export type Channel = "LINKEDIN" | "INSTAGRAM" | "EMAIL" | "FORMULAIRE";

export type SessionBrand = {
  id: string;
  name: string;
  emoji: string | null;
  platform: "LINKEDIN" | "INSTAGRAM" | "BOTH";
  pipelineStatus: PipelineStatus;
  contactName: string | null;
  sector: string;
  notes: string | null;
  profileUrl?: string | null;
  /** Personne à cibler aujourd'hui parmi les contacts identifiés de la marque (rotation
   * automatique) — absent si la marque n'a qu'un contact générique ou aucun contact connu. */
  engagementContact?: EngagementContact | null;
};

type Props = {
  messageBrands: SessionBrand[];
  routineBrands: SessionBrand[];
  qualificationBrands: QualificationProspect[];
};

const STEPS = 6;

const CATEGORY_LABELS: Record<string, string> = {
  GRANDE_MARQUE: "Grande marque",
  PME_STARTUP: "PME / Startup",
  INDEPENDANT: "Indépendant",
};

/** Seul le premier DM (LinkedIn/Instagram) existe en deux versions (standard / compliment
 * d'abord) — les relances et les canaux Email/Formulaire n'ont qu'une seule formulation. */
function hasVersionChoice(status: PipelineStatus, channel: Channel): boolean {
  return status === "ROUTINE_ENGAGEMENT" && (channel === "LINKEDIN" || channel === "INSTAGRAM");
}

function getTemplate(brand: SessionBrand, channel: Channel, version: "standard" | "compliment"): string {
  if (channel === "EMAIL") return messageTemplates.find((t) => t.id === "email-standard")?.content ?? "";
  if (channel === "FORMULAIRE") return messageTemplates.find((t) => t.id === "formulaire-standard")?.content ?? "";

  const p = channel.toLowerCase() as "linkedin" | "instagram";
  if (brand.pipelineStatus === "ROUTINE_ENGAGEMENT") {
    return messageTemplates.find((t) => t.id === `dm-${p}-${version}`)?.content ?? "";
  }
  if (brand.pipelineStatus === "PREMIER_DM") {
    return messageTemplates.find((t) => t.id === `relance-1-${p}`)?.content ?? "";
  }
  return messageTemplates.find((t) => t.id === `relance-2-${p}`)?.content ?? "";
}

function nextStatusFor(status: PipelineStatus): PipelineStatus {
  if (status === "ROUTINE_ENGAGEMENT") return "PREMIER_DM";
  if (status === "PREMIER_DM") return "RELANCE_1";
  return "RELANCE_2";
}

function templateLabel(status: PipelineStatus): string {
  if (status === "ROUTINE_ENGAGEMENT") return "Premier DM";
  if (status === "PREMIER_DM") return "Relance 1";
  return "Relance 2";
}

function channelLabel(channel: Channel | undefined): string {
  if (channel === "EMAIL") return "par Email";
  if (channel === "FORMULAIRE") return "par Formulaire";
  if (channel === "INSTAGRAM") return "Instagram";
  return "LinkedIn";
}

// ─── Step 1 : Vue d'ensemble ────────────────────────────────────────────────

function Step1({
  messageBrands,
  routineBrands,
  qualificationBrands,
  onStart,
}: {
  messageBrands: SessionBrand[];
  routineBrands: SessionBrand[];
  qualificationBrands: QualificationProspect[];
  onStart: () => void;
}) {
  const totalMessages = messageBrands.length;
  const totalRoutine = routineBrands.length;
  const totalQualification = qualificationBrands.length;

  if (totalMessages === 0 && totalRoutine === 0 && totalQualification === 0) {
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <span className="text-5xl">✨</span>
        <p className="text-xl font-extrabold text-ink">Rien à faire aujourd&apos;hui !</p>
        <p className="text-sm font-light text-ink/60">Toutes tes relances sont à jour. Reviens demain.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <p className="mb-2 text-sm font-light text-ink/50">Voici ce qui t&apos;attend aujourd&apos;hui</p>
        <h2 className="font-sans text-2xl font-extrabold text-ink">Prête à démarrer ?</h2>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center gap-1 rounded-2xl bg-white p-4 shadow-soft">
          <span className="text-3xl font-extrabold text-accent">{totalMessages}</span>
          <span className="text-center text-xs font-semibold text-ink/60">
            {totalMessages === 1 ? "message à envoyer" : "messages à envoyer"}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-2xl bg-white p-4 shadow-soft">
          <span className="text-3xl font-extrabold text-ink">{totalRoutine}</span>
          <span className="text-center text-xs font-semibold text-ink/60">
            {totalRoutine === 1 ? "marque à engager" : "marques à engager"}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-2xl bg-white p-4 shadow-soft">
          <span className="text-3xl font-extrabold text-ink" style={{ color: "#C4B5FD" }}>{totalQualification}</span>
          <span className="text-center text-xs font-semibold text-ink/60">
            {totalQualification === 1 ? "prospect à qualifier" : "prospects à qualifier"}
          </span>
        </div>
      </div>
      {totalMessages === 0 && (
        <p className="rounded-xl bg-soft px-4 py-3 text-sm font-light text-ink/60">
          Aucun DM ni relance à envoyer aujourd&apos;hui — on passe directement à la suite.
        </p>
      )}
      <button
        onClick={onStart}
        className="mx-auto rounded-2xl bg-cta px-8 py-4 text-base font-extrabold text-ink shadow-soft transition hover:opacity-90"
      >
        Commencer →
      </button>
    </div>
  );
}

// ─── Step 2 : Préparation des messages ──────────────────────────────────────

/** Canal(aux) social(aux) disponibles pour une marque, dans l'ordre d'affichage — Email et
 * Formulaire sont toujours proposés en plus, quelle que soit la présence de la marque sur
 * les réseaux (parfois plus pertinent d'écrire directement que de passer par un DM). */
function channelOptionsFor(brand: SessionBrand): { id: Channel; label: string }[] {
  const social: { id: Channel; label: string }[] =
    brand.platform === "BOTH"
      ? [
          { id: "LINKEDIN", label: "in" },
          { id: "INSTAGRAM", label: "ig" },
        ]
      : [{ id: brand.platform, label: brand.platform === "LINKEDIN" ? "in" : "ig" }];
  return [...social, { id: "EMAIL", label: "✉️ Email" }, { id: "FORMULAIRE", label: "📝 Formulaire" }];
}

function Step2({
  brands,
  onDone,
}: {
  brands: SessionBrand[];
  onDone: (prepared: Record<string, string>, channelByBrand: Record<string, Channel>) => void;
}) {
  const [index, setIndex] = useState(0);
  const [prepared, setPrepared] = useState<Record<string, string>>({});
  const [channelOverride, setChannelOverride] = useState<Record<string, Channel>>({});
  const [versionOverride, setVersionOverride] = useState<Record<string, "standard" | "compliment">>({});
  const [copied, setCopied] = useState(false);

  const brand = brands[index];
  const defaultChannel: Channel = brand.platform === "BOTH" ? "LINKEDIN" : brand.platform;
  const effectiveChannel: Channel = channelOverride[brand.id] ?? defaultChannel;
  const isSocial = effectiveChannel === "LINKEDIN" || effectiveChannel === "INSTAGRAM";
  const effectiveVersion: "standard" | "compliment" = versionOverride[brand.id] ?? "standard";
  const templateContent = getTemplate(brand, effectiveChannel, effectiveVersion);
  const currentText = prepared[brand.id] ?? templateContent;

  // Le contact ciblé ne sert de lien que s'il correspond au réseau actuellement sélectionné
  // (une marque "Les deux" peut avoir un contact LinkedIn connu mais être composée pour
  // Instagram — dans ce cas on retombe sur le lien générique de la marque sur ce réseau).
  // Hors DM (Email/Formulaire), pas de profil à proposer.
  const target =
    isSocial && brand.engagementContact && brand.engagementContact.contact.platform === effectiveChannel
      ? brand.engagementContact
      : null;
  const targetLink = isSocial
    ? target
      ? target.contact.profileUrl
      : brandProfileLink({ name: brand.name, platform: effectiveChannel, profileUrl: brand.profileUrl ?? null })
    : null;
  const targetBadgeStyle =
    effectiveChannel === "LINKEDIN"
      ? { backgroundColor: "#E0ECFF", color: "#2563EB" }
      : { backgroundColor: "#FCE7F3", color: "#DB2777" };
  const targetBadgeIcon = effectiveChannel === "LINKEDIN" ? "in" : "ig";

  function setText(text: string) {
    setPrepared((prev) => ({ ...prev, [brand.id]: text }));
  }

  function setChannel(channel: Channel) {
    setChannelOverride((prev) => ({ ...prev, [brand.id]: channel }));
    setPrepared((prev) => {
      const next = { ...prev };
      delete next[brand.id];
      return next;
    });
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleNext() {
    setCopied(false);
    if (index < brands.length - 1) {
      setIndex(index + 1);
    } else {
      const channelByBrand: Record<string, Channel> = {};
      for (const b of brands) {
        channelByBrand[b.id] = channelOverride[b.id] ?? (b.platform === "BOTH" ? "LINKEDIN" : b.platform);
      }
      onDone(prepared, channelByBrand);
    }
  }

  function handlePrev() {
    setCopied(false);
    setIndex(index - 1);
  }

  // Reset textarea when brand, channel or version changes
  const textareaKey = `${brand.id}-${effectiveChannel}-${effectiveVersion}`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-ink/40">
          {index + 1} / {brands.length}
        </p>
        <span className="rounded-full bg-accent-light/30 px-3 py-1 text-xs font-semibold text-accent">
          {templateLabel(brand.pipelineStatus)}
        </span>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-soft">
        <div className="mb-3 flex items-center gap-2">
          {brand.emoji && <span className="text-lg">{brand.emoji}</span>}
          <div>
            <p className="font-sans text-base font-extrabold text-ink">{brand.name}</p>
            <p className="text-xs font-light text-ink/50">{brand.sector}{brand.contactName ? ` · ${brand.contactName}` : ""}</p>
          </div>
          {isSocial && targetLink && (
            <ProfileLink
              href={targetLink}
              title={target ? `Voir le profil de ${target.contact.name}` : "Voir le profil"}
              className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={targetBadgeStyle}
            >
              {targetBadgeIcon}
            </ProfileLink>
          )}
        </div>
        {brand.notes && (
          <p className="mb-3 rounded-xl bg-soft px-3 py-2 text-xs font-light text-ink/60">
            💬 {brand.notes}
          </p>
        )}
        <p className="mb-1.5 text-xs font-semibold text-ink/40">Canal</p>
        <div className="mb-3 flex flex-wrap overflow-hidden rounded-xl border border-accent-light">
          {channelOptionsFor(brand).map((c) => (
            <button
              key={c.id}
              onClick={() => setChannel(c.id)}
              className={`flex-1 px-3 py-1.5 text-xs font-semibold transition ${
                effectiveChannel === c.id ? "bg-accent text-white" : "bg-white text-ink/60 hover:bg-soft"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        {hasVersionChoice(brand.pipelineStatus, effectiveChannel) && (
          <div className="flex overflow-hidden rounded-xl border border-accent-light">
            {(
              [
                { id: "standard" as const, label: "Standard" },
                { id: "compliment" as const, label: "Compliment d'abord" },
              ]
            ).map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  setVersionOverride((prev) => ({ ...prev, [brand.id]: v.id }));
                  setPrepared((prev) => {
                    const next = { ...prev };
                    delete next[brand.id];
                    return next;
                  });
                }}
                className={`flex-1 px-3 py-1.5 text-xs font-semibold transition ${
                  effectiveVersion === v.id ? "bg-accent text-white" : "bg-white text-ink/60 hover:bg-soft"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-ink/40">Message · personnalise les crochets ↓</p>
        <textarea
          key={textareaKey}
          value={currentText}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          className="w-full rounded-2xl border border-accent-light bg-white px-4 py-3 font-sans text-sm text-ink outline-none focus:border-accent"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleCopy}
          className={`flex-1 rounded-2xl py-3 text-sm font-extrabold transition ${
            copied ? "bg-green-100 text-green-700" : "bg-cta text-ink hover:opacity-90"
          }`}
        >
          {copied ? "✓ Copié !" : "Copier le message"}
        </button>
      </div>

      <div className="flex gap-3">
        {index > 0 && (
          <button
            onClick={handlePrev}
            className="flex-1 rounded-2xl border border-soft py-3 text-sm font-semibold text-ink/60 hover:bg-soft"
          >
            ← Précédent
          </button>
        )}
        <button
          onClick={handleNext}
          className="flex-1 rounded-2xl bg-accent py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          {index < brands.length - 1 ? "Suivant →" : "Passer à l'envoi →"}
        </button>
      </div>
    </div>
  );
}

// ─── Step 3 : Envoi et confirmation ─────────────────────────────────────────

function Step3({
  brands,
  channelByBrand,
  onDone,
}: {
  brands: SessionBrand[];
  channelByBrand: Record<string, Channel>;
  onDone: (sentCount: number) => void;
}) {
  const router = useRouter();
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  async function toggleSent(brand: SessionBrand) {
    if (sent[brand.id]) return;
    setSaving((prev) => ({ ...prev, [brand.id]: true }));
    await fetch(`/api/brands/${brand.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pipelineStatus: nextStatusFor(brand.pipelineStatus),
        channel: channelByBrand[brand.id] ?? null,
      }),
    });
    setSaving((prev) => ({ ...prev, [brand.id]: false }));
    setSent((prev) => ({ ...prev, [brand.id]: true }));
    router.refresh();
  }

  const sentCount = Object.values(sent).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm font-light text-ink/60">
        Coche chaque message une fois collé et envoyé. Le statut de la marque avancera automatiquement.
      </p>
      <div className="flex flex-col gap-3">
        {brands.map((brand) => (
          <div
            key={brand.id}
            className={`flex items-center gap-3 rounded-2xl p-4 transition ${
              sent[brand.id] ? "bg-green-50" : "bg-white shadow-soft"
            }`}
          >
            <button
              onClick={() => toggleSent(brand)}
              disabled={sent[brand.id] || saving[brand.id]}
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                sent[brand.id]
                  ? "border-green-500 bg-green-500 text-white"
                  : "border-ink/30 hover:border-accent"
              }`}
            >
              {sent[brand.id] && "✓"}
              {saving[brand.id] && <span className="h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />}
            </button>
            <div className="flex-1">
              <p className={`text-sm font-extrabold ${sent[brand.id] ? "text-ink/40 line-through" : "text-ink"}`}>
                {brand.emoji && `${brand.emoji} `}{brand.name}
              </p>
              <p className="text-xs font-light text-ink/50">
                {templateLabel(brand.pipelineStatus)} · {channelLabel(channelByBrand[brand.id])}
              </p>
            </div>
            {sent[brand.id] && (
              <span className="text-xs font-semibold text-green-600">
                → {templateLabel(nextStatusFor(brand.pipelineStatus))}
              </span>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={() => onDone(sentCount)}
        className="w-full rounded-2xl bg-accent py-3 text-sm font-semibold text-white transition hover:opacity-90"
      >
        {sentCount === brands.length ? "Tous envoyés ! Continuer →" : `Continuer (${sentCount}/${brands.length} envoyés) →`}
      </button>
    </div>
  );
}

// ─── Step 4 : Qualification de prospects ────────────────────────────────────

function StepQualify({
  prospects,
  onDone,
}: {
  prospects: QualificationProspect[];
  onDone: (qualifiedCount: number) => void;
}) {
  const [resolved, setResolved] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<Record<string, string | null>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const qualifiedCount = Object.keys(resolved).length;

  async function handleStatus(id: string, status: string) {
    setSaving((prev) => ({ ...prev, [id]: true }));
    await fetch(`/api/import/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setSaving((prev) => ({ ...prev, [id]: false }));
    setResolved((prev) => ({ ...prev, [id]: status }));
  }

  async function handleCategory(id: string, brandCategory: string) {
    setCategories((prev) => ({ ...prev, [id]: brandCategory || null }));
    await fetch(`/api/import/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandCategory: brandCategory || null }),
    });
  }

  if (prospects.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <p className="rounded-xl bg-soft px-4 py-3 text-sm font-light text-ink/60">
          Aucun prospect à qualifier aujourd&apos;hui — la liste est à jour.
        </p>
        <button
          onClick={() => onDone(0)}
          className="w-full rounded-2xl bg-accent py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Continuer →
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm font-light text-ink/60">
        Qualifie ces {prospects.length} marques tirées de ta liste d&apos;import LinkedIn/Instagram.
      </p>
      <div className="flex flex-col gap-3">
        {prospects.map((p) => {
          const badge = platformBadge[p.platform];
          const status = resolved[p.id];
          const category = categories[p.id] !== undefined ? categories[p.id] : p.brandCategory;
          const link = bestProfileLink(p);
          return (
            <div
              key={p.id}
              className={`flex flex-col gap-3 rounded-2xl p-4 transition ${
                status ? "bg-green-50" : "bg-white shadow-soft"
              }`}
            >
              <div className="flex items-center gap-2">
                {badge && (
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{ backgroundColor: badge.bg, color: badge.text }}
                  >
                    {badge.icon}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-ink">{p.rawName}</p>
                  {p.handle && <p className="truncate text-xs font-light text-ink/40">@{p.handle}</p>}
                </div>
                <ProfileLink
                  href={link}
                  className="shrink-0 rounded-lg bg-soft px-2.5 py-1 text-xs font-semibold text-accent transition hover:bg-accent-light/40"
                >
                  Voir profil ↗
                </ProfileLink>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={category ?? ""}
                  onChange={(e) => handleCategory(p.id, e.target.value)}
                  className="rounded-lg border border-accent-light bg-soft px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                >
                  <option value="">—</option>
                  <option value="GRANDE_MARQUE">{CATEGORY_LABELS.GRANDE_MARQUE}</option>
                  <option value="PME_STARTUP">{CATEGORY_LABELS.PME_STARTUP}</option>
                  <option value="INDEPENDANT">{CATEGORY_LABELS.INDEPENDANT}</option>
                </select>
                <div className="ml-auto flex gap-1 rounded-xl bg-soft/60 p-1">
                  <button
                    onClick={() => handleStatus(p.id, "OUI")}
                    disabled={saving[p.id]}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      status === "OUI" ? "bg-cta text-ink" : "text-ink/50 hover:bg-white"
                    }`}
                  >
                    Oui
                  </button>
                  <button
                    onClick={() => handleStatus(p.id, "NON")}
                    disabled={saving[p.id]}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      status === "NON" ? "bg-red-500 text-white" : "text-ink/50 hover:bg-white"
                    }`}
                  >
                    Non
                  </button>
                  <button
                    onClick={() => handleStatus(p.id, "PLUS_TARD")}
                    disabled={saving[p.id]}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      status === "PLUS_TARD" ? "bg-accent-light text-ink" : "text-ink/50 hover:bg-white"
                    }`}
                  >
                    Maybe
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <button
        onClick={() => onDone(qualifiedCount)}
        className="w-full rounded-2xl bg-accent py-3 text-sm font-semibold text-white transition hover:opacity-90"
      >
        {qualifiedCount === prospects.length
          ? "Tout qualifié ! Continuer →"
          : `Continuer (${qualifiedCount}/${prospects.length} qualifiés) →`}
      </button>
    </div>
  );
}

// ─── Step 5 : Routine d'engagement ──────────────────────────────────────────

function Step4({
  brands,
  onDone,
}: {
  brands: SessionBrand[];
  onDone: (doneCount: number) => void;
}) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const doneCount = Object.values(done).filter(Boolean).length;

  async function handleToggle(brand: SessionBrand) {
    const nowDone = !done[brand.id];
    setDone((prev) => ({ ...prev, [brand.id]: nowDone }));
    // On ne persiste qu'à la coche (pas au décochage) : ça avance la cadence de 2-3x/semaine
    // et fait tourner vers le prochain contact identifié la prochaine fois.
    if (nowDone) {
      await fetch(`/api/brands/${brand.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lastEngagementAt: new Date().toISOString(),
          lastEngagementContactIndex: brand.engagementContact?.index ?? null,
        }),
      });
    }
  }

  if (brands.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <p className="rounded-xl bg-soft px-4 py-3 text-sm font-light text-ink/60">
          Aucune marque en routine d&apos;engagement en ce moment.
        </p>
        <button
          onClick={() => onDone(0)}
          className="w-full rounded-2xl bg-accent py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Terminer la session →
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm font-light text-ink/60">
        Like, commente ou interagis avec chaque marque aujourd&apos;hui. Coche une fois fait.
      </p>
      <div className="flex flex-col gap-3">
        {brands.map((brand) => {
          const target = brand.engagementContact;
          const targetLink = target
            ? target.contact.profileUrl
            : brandProfileLink({ name: brand.name, platform: brand.platform, profileUrl: brand.profileUrl ?? null });
          const targetBadgeStyle =
            (target ? target.contact.platform : brand.platform) === "LINKEDIN"
              ? { backgroundColor: "#E0ECFF", color: "#2563EB" }
              : (target ? target.contact.platform : brand.platform) === "INSTAGRAM"
              ? { backgroundColor: "#FCE7F3", color: "#DB2777" }
              : { backgroundColor: "#EDE9FE", color: "#7C3AED" };
          const targetBadgeIcon =
            (target ? target.contact.platform : brand.platform) === "LINKEDIN"
              ? "in"
              : (target ? target.contact.platform : brand.platform) === "INSTAGRAM"
              ? "ig"
              : "in/ig";

          return (
            <div
              key={brand.id}
              className={`flex flex-col gap-2 rounded-2xl p-4 transition ${
                done[brand.id] ? "bg-green-50" : "bg-white shadow-soft"
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggle(brand)}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    done[brand.id]
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-ink/30 hover:border-accent"
                  }`}
                >
                  {done[brand.id] && "✓"}
                </button>
                <div className="flex-1">
                  <p className={`text-sm font-extrabold ${done[brand.id] ? "text-ink/40 line-through" : "text-ink"}`}>
                    {brand.emoji && `${brand.emoji} `}{brand.name}
                  </p>
                  <p className="text-xs font-light text-ink/50">{brand.sector}</p>
                </div>
                <a
                  href={`/marques/${brand.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Ouvrir la fiche dans un nouvel onglet pour y noter des infos"
                  className="shrink-0 rounded-full bg-soft px-2.5 py-1 text-[11px] font-semibold text-ink/60 transition hover:bg-accent-light/40 hover:text-accent"
                >
                  📝 Fiche
                </a>
                <ProfileLink
                  href={targetLink}
                  title={target ? `Voir le profil de ${target.contact.name}` : "Voir le profil"}
                  className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={targetBadgeStyle}
                >
                  {targetBadgeIcon}
                </ProfileLink>
              </div>
              {target && (
                <p className="ml-9 text-xs font-semibold text-accent">
                  🎯 Aujourd&apos;hui : {target.contact.name}
                  {target.contact.position && <span className="font-light text-ink/50"> — {target.contact.position}</span>}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <button
        onClick={() => onDone(doneCount)}
        className="w-full rounded-2xl bg-accent py-3 text-sm font-semibold text-white transition hover:opacity-90"
      >
        {doneCount === brands.length
          ? "Tout fait ! Terminer →"
          : `Terminer (${doneCount}/${brands.length} faits) →`}
      </button>
    </div>
  );
}

// ─── Step 5 : Résumé de session ──────────────────────────────────────────────

function Step5({
  sentCount,
  engagedCount,
  qualifiedCount,
  onClose,
}: {
  sentCount: number;
  engagedCount: number;
  qualifiedCount: number;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <span className="text-5xl">🐾</span>
      <h2 className="font-sans text-2xl font-extrabold text-ink">Session terminée !</h2>
      <div className="grid w-full grid-cols-3 gap-3">
        <div className="flex flex-col items-center gap-1 rounded-2xl bg-white p-4 shadow-soft">
          <span className="text-3xl font-extrabold text-accent">{sentCount}</span>
          <span className="text-center text-xs font-semibold text-ink/60">
            {sentCount === 1 ? "message envoyé" : "messages envoyés"}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-2xl bg-white p-4 shadow-soft">
          <span className="text-3xl font-extrabold text-ink">{engagedCount}</span>
          <span className="text-center text-xs font-semibold text-ink/60">
            {engagedCount === 1 ? "engagement fait" : "engagements faits"}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-2xl bg-white p-4 shadow-soft">
          <span className="text-3xl font-extrabold" style={{ color: "#C4B5FD" }}>{qualifiedCount}</span>
          <span className="text-center text-xs font-semibold text-ink/60">
            {qualifiedCount === 1 ? "prospect qualifié" : "prospects qualifiés"}
          </span>
        </div>
      </div>
      <p className="text-sm font-light text-ink/60">Belle session ! Reviens demain pour continuer. 🌱</p>
      <button
        onClick={onClose}
        className="rounded-2xl bg-cta px-8 py-4 text-base font-extrabold text-ink shadow-soft transition hover:opacity-90"
      >
        Retour au Dashboard
      </button>
    </div>
  );
}

// ─── Barre de progression ────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-6 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-ink/40">Étape {step} / {total}</span>
        <span className="text-xs font-semibold text-accent">
          {step === 1
            ? "Vue d'ensemble"
            : step === 2
            ? "Préparer les messages"
            : step === 3
            ? "Confirmer les envois"
            : step === 4
            ? "Qualifier des prospects"
            : step === 5
            ? "Routine d'engagement"
            : "Résumé"}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-soft">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${((step - 1) / (total - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function GuidedSession({ messageBrands, routineBrands, qualificationBrands }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  // Plus haute étape jamais atteinte dans la session en cours : sert à garder une étape montée
  // (juste masquée) une fois visitée, même si on revient en arrière ensuite — sans ça, revenir
  // à l'étape 1 puis ravancer démonterait les étapes suivantes et perdrait ce qui y était saisi.
  const [maxStepReached, setMaxStepReached] = useState(1);
  const [sentCount, setSentCount] = useState(0);
  const [engagedCount, setEngagedCount] = useState(0);
  const [qualifiedCount, setQualifiedCount] = useState(0);
  const [channelByBrand, setChannelByBrand] = useState<Record<string, Channel>>({});
  // Données gelées au démarrage de la session pour éviter que router.refresh() les vide en cours de route
  const [frozen, setFrozen] = useState<{
    msg: SessionBrand[];
    routine: SessionBrand[];
    qualification: QualificationProspect[];
  } | null>(null);

  const activeMsg = frozen?.msg ?? [];
  const activeRoutine = frozen?.routine ?? [];
  const activeQualification = frozen?.qualification ?? [];
  const skipMessages = activeMsg.length === 0;

  const goToStep = useCallback((next: number) => {
    setStep(next);
    setMaxStepReached((m) => Math.max(m, next));
  }, []);

  function handleOpen() {
    setFrozen({ msg: messageBrands, routine: routineBrands, qualification: qualificationBrands });
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setStep(1);
    setMaxStepReached(1);
    setSentCount(0);
    setEngagedCount(0);
    setQualifiedCount(0);
    setChannelByBrand({});
    setFrozen(null);
  }

  const handleStart = useCallback(() => {
    goToStep(skipMessages ? 4 : 2);
  }, [skipMessages, goToStep]);

  const handleStep2Done = useCallback(
    (_prepared: Record<string, string>, channels: Record<string, Channel>) => {
      setChannelByBrand(channels);
      goToStep(3);
    },
    [goToStep]
  );

  const handleStep3Done = useCallback((count: number) => {
    setSentCount(count);
    goToStep(4);
  }, [goToStep]);

  const handleQualifyDone = useCallback((count: number) => {
    setQualifiedCount(count);
    goToStep(5);
  }, [goToStep]);

  const handleStep4Done = useCallback((count: number) => {
    setEngagedCount(count);
    goToStep(6);
  }, [goToStep]);

  const handleBack = useCallback(() => {
    // Retour en arrière seulement : ne touche jamais maxStepReached, pour que les étapes déjà
    // visitées restent montées (donc leurs données conservées) même après un aller-retour.
    setStep((s) => {
      if (s === 2) return 1;
      if (s === 3) return 2;
      if (s === 4) return skipMessages ? 1 : 3;
      if (s === 5) return 4;
      return s;
    });
  }, [skipMessages]);

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="rounded-2xl bg-cta px-6 py-3 text-sm font-extrabold text-ink shadow-soft transition hover:opacity-90"
      >
        ▶ Démarrer la session
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-8">
      <div className="w-full max-w-lg rounded-3xl bg-soft p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-sans text-lg font-extrabold text-ink">Session du jour</h2>
          <button
            onClick={handleClose}
            className="rounded-full p-2 text-ink/40 hover:bg-white hover:text-ink"
          >
            ✕
          </button>
        </div>

        <ProgressBar step={step} total={STEPS} />

        {step >= 2 && step <= 5 && (
          <button
            onClick={handleBack}
            className="mb-4 flex items-center gap-1 text-xs font-semibold text-ink/40 hover:text-ink"
          >
            ← Précédent
          </button>
        )}

        {/* Chaque étape reste montée (juste masquée) une fois atteinte, pour ne jamais perdre
            ce qui a déjà été saisi/coché si on revient en arrière puis qu'on ravance. */}
        {step === 1 && (
          <Step1
            messageBrands={activeMsg}
            routineBrands={activeRoutine}
            qualificationBrands={activeQualification}
            onStart={handleStart}
          />
        )}
        {activeMsg.length > 0 && (
          <div className={step === 2 ? "" : "hidden"}>
            <Step2 brands={activeMsg} onDone={handleStep2Done} />
          </div>
        )}
        {maxStepReached >= 3 && (
          <div className={step === 3 ? "" : "hidden"}>
            <Step3 brands={activeMsg} channelByBrand={channelByBrand} onDone={handleStep3Done} />
          </div>
        )}
        {maxStepReached >= 4 && (
          <div className={step === 4 ? "" : "hidden"}>
            <StepQualify prospects={activeQualification} onDone={handleQualifyDone} />
          </div>
        )}
        {maxStepReached >= 5 && (
          <div className={step === 5 ? "" : "hidden"}>
            <Step4 brands={activeRoutine} onDone={handleStep4Done} />
          </div>
        )}
        {step === 6 && (
          <Step5
            sentCount={sentCount}
            engagedCount={engagedCount}
            qualifiedCount={qualifiedCount}
            onClose={handleClose}
          />
        )}
      </div>
    </div>
  );
}
