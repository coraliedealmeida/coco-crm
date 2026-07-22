"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { messageTemplates } from "@/lib/messages";
import type { PipelineStatus } from "@prisma/client";

export type SessionBrand = {
  id: string;
  name: string;
  emoji: string | null;
  platform: "LINKEDIN" | "INSTAGRAM" | "BOTH";
  pipelineStatus: PipelineStatus;
  contactName: string | null;
  sector: string;
  notes: string | null;
};

type Props = {
  messageBrands: SessionBrand[];
  routineBrands: SessionBrand[];
};

const STEPS = 5;

function getTemplate(brand: SessionBrand, platform: "LINKEDIN" | "INSTAGRAM"): string {
  const p = platform.toLowerCase() as "linkedin" | "instagram";
  if (brand.pipelineStatus === "ROUTINE_ENGAGEMENT") {
    return (
      messageTemplates.find((t) => t.id === `dm-${p}-standard`)?.content ?? ""
    );
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

// ─── Step 1 : Vue d'ensemble ────────────────────────────────────────────────

function Step1({
  messageBrands,
  routineBrands,
  onStart,
}: {
  messageBrands: SessionBrand[];
  routineBrands: SessionBrand[];
  onStart: () => void;
}) {
  const totalMessages = messageBrands.length;
  const totalRoutine = routineBrands.length;

  if (totalMessages === 0 && totalRoutine === 0) {
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
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col items-center gap-1 rounded-2xl bg-white p-5 shadow-soft">
          <span className="text-3xl font-extrabold text-accent">{totalMessages}</span>
          <span className="text-xs font-semibold text-ink/60 text-center">
            {totalMessages === 1 ? "message à envoyer" : "messages à envoyer"}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-2xl bg-white p-5 shadow-soft">
          <span className="text-3xl font-extrabold text-ink">{totalRoutine}</span>
          <span className="text-xs font-semibold text-ink/60 text-center">
            {totalRoutine === 1 ? "marque à engager" : "marques à engager"}
          </span>
        </div>
      </div>
      {totalMessages === 0 && (
        <p className="rounded-xl bg-soft px-4 py-3 text-sm font-light text-ink/60">
          Aucun DM ni relance à envoyer aujourd&apos;hui — on passe directement à la routine d&apos;engagement.
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

function Step2({
  brands,
  onDone,
}: {
  brands: SessionBrand[];
  onDone: (prepared: Record<string, string>) => void;
}) {
  const [index, setIndex] = useState(0);
  const [prepared, setPrepared] = useState<Record<string, string>>({});
  const [platformOverride, setPlatformOverride] = useState<Record<string, "LINKEDIN" | "INSTAGRAM">>({});
  const [copied, setCopied] = useState(false);

  const brand = brands[index];
  const effectivePlatform: "LINKEDIN" | "INSTAGRAM" =
    brand.platform === "BOTH"
      ? (platformOverride[brand.id] ?? "LINKEDIN")
      : brand.platform;
  const templateContent = getTemplate(brand, effectivePlatform);
  const currentText = prepared[brand.id] ?? templateContent;

  function setText(text: string) {
    setPrepared((prev) => ({ ...prev, [brand.id]: text }));
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
      onDone(prepared);
    }
  }

  function handlePrev() {
    setCopied(false);
    setIndex(index - 1);
  }

  // Reset textarea when brand or platform changes
  const textareaKey = `${brand.id}-${effectivePlatform}`;

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
          {brand.platform === "BOTH" && (
            <div className="ml-auto flex overflow-hidden rounded-xl border border-accent-light">
              {(["LINKEDIN", "INSTAGRAM"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPlatformOverride((prev) => ({ ...prev, [brand.id]: p }));
                    setPrepared((prev) => {
                      const next = { ...prev };
                      delete next[brand.id];
                      return next;
                    });
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold transition ${
                    effectivePlatform === p ? "bg-accent text-white" : "bg-white text-ink/60 hover:bg-soft"
                  }`}
                >
                  {p === "LINKEDIN" ? "in" : "ig"}
                </button>
              ))}
            </div>
          )}
        </div>
        {brand.notes && (
          <p className="mb-3 rounded-xl bg-soft px-3 py-2 text-xs font-light text-ink/60">
            💬 {brand.notes}
          </p>
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
  onDone,
}: {
  brands: SessionBrand[];
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
      body: JSON.stringify({ pipelineStatus: nextStatusFor(brand.pipelineStatus) }),
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
              <p className="text-xs font-light text-ink/50">{templateLabel(brand.pipelineStatus)}</p>
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

// ─── Step 4 : Routine d'engagement ──────────────────────────────────────────

function Step4({
  brands,
  onDone,
}: {
  brands: SessionBrand[];
  onDone: (doneCount: number) => void;
}) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const doneCount = Object.values(done).filter(Boolean).length;

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
        {brands.map((brand) => (
          <div
            key={brand.id}
            className={`flex items-center gap-3 rounded-2xl p-4 transition ${
              done[brand.id] ? "bg-green-50" : "bg-white shadow-soft"
            }`}
          >
            <button
              onClick={() => setDone((prev) => ({ ...prev, [brand.id]: !prev[brand.id] }))}
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
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={
                brand.platform === "LINKEDIN"
                  ? { backgroundColor: "#E0ECFF", color: "#2563EB" }
                  : brand.platform === "INSTAGRAM"
                  ? { backgroundColor: "#FCE7F3", color: "#DB2777" }
                  : { backgroundColor: "#EDE9FE", color: "#7C3AED" }
              }
            >
              {brand.platform === "LINKEDIN" ? "in" : brand.platform === "INSTAGRAM" ? "ig" : "in/ig"}
            </span>
          </div>
        ))}
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
  onClose,
}: {
  sentCount: number;
  engagedCount: number;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <span className="text-5xl">🐾</span>
      <h2 className="font-sans text-2xl font-extrabold text-ink">Session terminée !</h2>
      <div className="grid w-full grid-cols-2 gap-4">
        <div className="flex flex-col items-center gap-1 rounded-2xl bg-white p-5 shadow-soft">
          <span className="text-3xl font-extrabold text-accent">{sentCount}</span>
          <span className="text-xs font-semibold text-ink/60">
            {sentCount === 1 ? "message envoyé" : "messages envoyés"}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-2xl bg-white p-5 shadow-soft">
          <span className="text-3xl font-extrabold text-ink">{engagedCount}</span>
          <span className="text-xs font-semibold text-ink/60">
            {engagedCount === 1 ? "engagement fait" : "engagements faits"}
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
          {step === 1 ? "Vue d'ensemble" : step === 2 ? "Préparer les messages" : step === 3 ? "Confirmer les envois" : step === 4 ? "Routine d'engagement" : "Résumé"}
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

export default function GuidedSession({ messageBrands, routineBrands }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [sentCount, setSentCount] = useState(0);
  const [engagedCount, setEngagedCount] = useState(0);
  // Données gelées au démarrage de la session pour éviter que router.refresh() les vide en cours de route
  const [frozen, setFrozen] = useState<{ msg: SessionBrand[]; routine: SessionBrand[] } | null>(null);

  const activeMsg = frozen?.msg ?? [];
  const activeRoutine = frozen?.routine ?? [];
  const skipMessages = activeMsg.length === 0;

  function handleOpen() {
    setFrozen({ msg: messageBrands, routine: routineBrands });
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setStep(1);
    setSentCount(0);
    setEngagedCount(0);
    setFrozen(null);
  }

  const handleStart = useCallback(() => {
    setStep(skipMessages ? 4 : 2);
  }, [skipMessages]);

  const handleStep2Done = useCallback(() => {
    setStep(3);
  }, []);

  const handleStep3Done = useCallback((count: number) => {
    setSentCount(count);
    setStep(4);
  }, []);

  const handleStep4Done = useCallback((count: number) => {
    setEngagedCount(count);
    setStep(5);
  }, []);

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

        {step === 1 && (
          <Step1
            messageBrands={activeMsg}
            routineBrands={activeRoutine}
            onStart={handleStart}
          />
        )}
        {step === 2 && activeMsg.length > 0 && (
          <Step2 brands={activeMsg} onDone={handleStep2Done} />
        )}
        {step === 3 && (
          <Step3 brands={activeMsg} onDone={handleStep3Done} />
        )}
        {step === 4 && (
          <Step4 brands={activeRoutine} onDone={handleStep4Done} />
        )}
        {step === 5 && (
          <Step5 sentCount={sentCount} engagedCount={engagedCount} onClose={handleClose} />
        )}
      </div>
    </div>
  );
}
