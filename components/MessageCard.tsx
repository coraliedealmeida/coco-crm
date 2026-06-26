"use client";

import { useState } from "react";
import type { MessageTemplate } from "@/lib/messages";

export default function MessageCard({ template }: { template: MessageTemplate }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(template.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const parts = template.content.split(/(\[[^\]]+\])/g);

  return (
    <div className="rounded-3xl bg-white p-6 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-sans text-base font-extrabold text-ink">{template.title}</h2>
        <button
          onClick={handleCopy}
          className="rounded-xl bg-cta px-4 py-2 text-sm font-semibold text-ink transition hover:opacity-90"
        >
          {copied ? "Copié ✓" : "Copier"}
        </button>
      </div>
      <p className="whitespace-pre-wrap text-sm font-light leading-relaxed text-ink/80">
        {parts.map((part, i) =>
          part.startsWith("[") && part.endsWith("]") ? (
            <span key={i} className="rounded bg-accent-light/50 px-1 font-semibold text-accent">
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </p>
    </div>
  );
}
