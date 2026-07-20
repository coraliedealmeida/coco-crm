import Link from "next/link";
import NewClientForm from "@/components/NewClientForm";

export default function NewClientPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/clients" className="text-sm font-semibold text-accent hover:underline">
          ← Retour aux projets
        </Link>
        <h1 className="mt-2 font-sans text-3xl font-extrabold text-ink">Nouveau client</h1>
      </header>
      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <NewClientForm />
      </div>
    </div>
  );
}
