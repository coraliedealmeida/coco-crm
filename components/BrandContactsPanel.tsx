"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Contact = {
  id: string;
  name: string;
  role: string | null;
  profileUrl: string | null;
  platform: string;
};

export default function BrandContactsPanel({ brandId, contacts }: { brandId: string; contacts: Contact[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [platform, setPlatform] = useState("LINKEDIN");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!name.trim()) return;
    setSaving(true);
    await fetch(`/api/brands/${brandId}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), role: role.trim() || null, profileUrl: profileUrl.trim() || null, platform }),
    });
    setSaving(false);
    setName("");
    setRole("");
    setProfileUrl("");
    setPlatform("LINKEDIN");
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce contact ?")) return;
    await fetch(`/api/brand-contacts/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-soft">
      <h2 className="mb-1 flex items-center gap-2 font-sans text-base font-extrabold text-ink">
        <span>👤</span> Contacts d&apos;intérêt
      </h2>
      <p className="mb-4 text-xs font-light text-ink/50">
        Les personnes notées ici sont ciblées à tour de rôle en routine d&apos;engagement.
      </p>

      <div className="mb-4 flex flex-col gap-2">
        {contacts.length === 0 && <p className="text-sm font-light text-ink/40">Aucun contact noté.</p>}
        {contacts.map((c) => (
          <div key={c.id} className="group flex items-center justify-between gap-3 rounded-xl bg-soft px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">
                {c.name}
                {c.role && <span className="font-light text-ink/50"> — {c.role}</span>}
              </p>
              {c.profileUrl && (
                <a
                  href={c.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-xs text-accent hover:underline"
                >
                  {c.profileUrl}
                </a>
              )}
            </div>
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={
                c.platform === "INSTAGRAM"
                  ? { backgroundColor: "#FCE7F3", color: "#DB2777" }
                  : { backgroundColor: "#E0ECFF", color: "#2563EB" }
              }
            >
              {c.platform === "INSTAGRAM" ? "ig" : "in"}
            </span>
            <button
              onClick={() => handleDelete(c.id)}
              className="shrink-0 text-ink/30 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
              aria-label="Supprimer ce contact"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 border-t border-soft pt-4">
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom"
            className="flex-1 rounded-xl border border-accent-light bg-soft px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Poste (optionnel)"
            className="flex-1 rounded-xl border border-accent-light bg-soft px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
        </div>
        <div className="flex gap-2">
          <input
            value={profileUrl}
            onChange={(e) => setProfileUrl(e.target.value)}
            placeholder="Lien du profil (optionnel)"
            className="flex-1 rounded-xl border border-accent-light bg-soft px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="rounded-xl border border-accent-light bg-soft px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          >
            <option value="LINKEDIN">LinkedIn</option>
            <option value="INSTAGRAM">Instagram</option>
          </select>
        </div>
        <button
          onClick={handleAdd}
          disabled={saving || !name.trim()}
          className="w-fit rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Ajout..." : "Ajouter ce contact"}
        </button>
      </div>
    </div>
  );
}
