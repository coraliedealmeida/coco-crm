"use client";

import { useState } from "react";
import { messageTemplates } from "@/lib/messages";
import MessageCard from "@/components/MessageCard";

const tabs = [
  { id: "LINKEDIN" as const, label: "LinkedIn" },
  { id: "INSTAGRAM" as const, label: "Instagram" },
];

export default function MessagesPage() {
  const [tab, setTab] = useState<"LINKEDIN" | "INSTAGRAM">("LINKEDIN");
  const filtered = messageTemplates.filter((t) => t.platform === tab);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-sans text-3xl font-extrabold text-ink">Messages types</h1>
        <p className="font-light text-ink/60">
          Les éléments entre crochets sont à personnaliser avant l&apos;envoi.
        </p>
      </header>

      <div className="flex w-fit gap-1 rounded-3xl bg-white p-1.5 shadow-soft">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-6 py-2.5 text-sm font-semibold transition ${
              tab === t.id ? "bg-accent text-white" : "text-ink/60 hover:bg-soft"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {filtered.map((t) => (
          <MessageCard key={t.id} template={t} />
        ))}
      </div>
    </div>
  );
}
