"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Task = { id: string; label: string; completed: boolean };

export default function DashboardNotesWidget({
  initialTasks,
  initialNote,
}: {
  initialTasks: Task[];
  initialNote: string;
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [newTask, setNewTask] = useState("");
  const [adding, setAdding] = useState(false);
  const [note, setNote] = useState(initialNote);
  const [saved, setSaved] = useState(false);

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    const label = newTask.trim();
    if (!label) return;
    setAdding(true);
    try {
      const res = await fetch("/api/dashboard-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      const task = await res.json();
      setTasks((prev) => [...prev, task]);
      setNewTask("");
    } finally {
      setAdding(false);
    }
  }

  async function toggleTask(id: string, completed: boolean) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed } : t)));
    await fetch(`/api/dashboard-tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
  }

  async function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/dashboard-tasks/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function handleNoteBlur() {
    await fetch("/api/dashboard-note", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: note }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const pending = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Tâches à cocher */}
      <div className="flex flex-col gap-3">
        <form onSubmit={handleAddTask} className="flex gap-2">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Ajouter une tâche…"
            className="flex-1 rounded-xl border border-accent-light bg-soft px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={adding || !newTask.trim()}
            className="rounded-xl bg-cta px-4 py-2 text-sm font-semibold text-ink transition hover:opacity-90 disabled:opacity-50"
          >
            Ajouter
          </button>
        </form>

        {tasks.length === 0 ? (
          <p className="text-sm font-light text-ink/40">Aucune tâche pour le moment.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {[...pending, ...done].map((task) => (
              <div key={task.id} className="group flex items-center gap-3 rounded-xl bg-soft px-3 py-2">
                <button
                  onClick={() => toggleTask(task.id, !task.completed)}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    task.completed ? "border-accent bg-accent text-white" : "border-ink/30 hover:border-accent"
                  }`}
                >
                  {task.completed && "✓"}
                </button>
                <span
                  className={`flex-1 text-sm ${task.completed ? "text-ink/40 line-through" : "text-ink"}`}
                >
                  {task.label}
                </span>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-ink/30 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                  aria-label="Supprimer"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes libres */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink/40">Notes</span>
          {saved && <span className="text-xs font-semibold text-accent">Enregistré ✓</span>}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={handleNoteBlur}
          rows={8}
          placeholder="Notes libres, idées, choses à ne pas oublier…"
          className="w-full flex-1 rounded-xl border border-accent-light bg-soft px-3 py-2 text-sm text-ink outline-none focus:border-accent"
        />
      </div>
    </div>
  );
}
