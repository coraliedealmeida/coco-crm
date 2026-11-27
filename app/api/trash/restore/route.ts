import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/apiAuth";
import { restore, type TrashModel } from "@/lib/trash";

const MODELS: TrashModel[] = ["brand", "project", "invoice", "quoteRequest"];

/** Restaure un élément de la corbeille (et ce qui avait été mis à la corbeille avec lui). */
export async function POST(request: NextRequest) {
  const denied = await requireSession();
  if (denied) return denied;

  const { model, id } = (await request.json().catch(() => ({}))) as { model?: string; id?: string };
  if (!id || !MODELS.includes(model as TrashModel)) {
    return NextResponse.json({ error: "Élément inconnu." }, { status: 400 });
  }
  await restore(model as TrashModel, id);
  return NextResponse.json({ ok: true });
}
