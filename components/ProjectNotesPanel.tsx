"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Note = { id: string; date: string; content: string };

function toDateInputValue(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export default function ProjectNotesPanel({ projectId, notes }: { projectId: string; notes: Note[] }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    if (!content.trim()) return;
    setAdding(true);
    await fetch(`/api/projects/${projectId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: new Date(date).toISOString(), content }),
    });
    setContent("");
    setDate(new Date().toISOString().slice(0, 10));
    setAdding(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      {notes.length === 0 ? (
        <p className="text-sm font-light text-ink/40">Aucune note de suivi.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {notes.map((note) => (
            <NoteRow key={note.id} note={note} />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-2xl bg-soft/60 p-4">
        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-accent-light bg-white px-3 py-2 text-xs text-ink outline-none focus:border-accent"
          />
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          placeholder="Ajouter une note de suivi..."
          className="w-full rounded-lg border border-accent-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !content.trim()}
          className="w-fit rounded-lg bg-cta px-4 py-2 text-sm font-semibold text-ink transition hover:opacity-90 disabled:opacity-50"
        >
          {adding ? "Ajout..." : "Ajouter"}
        </button>
      </div>
    </div>
  );
}

function NoteRow({ note }: { note: Note }) {
  const router = useRouter();
  const [editingDate, setEditingDate] = useState(false);

  async function handleDelete() {
    if (!confirm("Supprimer cette note ?")) return;
    await fetch(`/api/project-notes/${note.id}`, { method: "DELETE" });
    router.refresh();
  }

  async function handleDateChange(value: string) {
    if (!value) return;
    setEditingDate(false);
    await fetch(`/api/project-notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: new Date(value).toISOString() }),
    });
    router.refresh();
  }

  return (
    <div className="group rounded-xl border-l-4 border-accent-light bg-soft px-4 py-3">
      <div className="flex items-center justify-between">
        {editingDate ? (
          <input
            type="date"
            autoFocus
            defaultValue={toDateInputValue(note.date)}
            onBlur={() => setEditingDate(false)}
            onChange={(e) => handleDateChange(e.target.value)}
            className="rounded-lg border border-accent-light bg-white px-2 py-1 text-xs text-ink outline-none focus:border-accent"
          />
        ) : (
          <button
            onClick={() => setEditingDate(true)}
            className="text-xs font-semibold text-accent underline-offset-2 hover:underline"
            title="Modifier la date"
          >
            {new Date(note.date).toLocaleDateString("fr-FR")}
          </button>
        )}
        <button
          onClick={handleDelete}
          aria-label="Supprimer cette note"
          className="text-ink/30 opacity-0 transition group-hover:opacity-100 hover:text-red-500"
        >
          ×
        </button>
      </div>
      <p className="mt-1 whitespace-pre-wrap text-sm font-light text-ink/70">{note.content}</p>
    </div>
  );
}
