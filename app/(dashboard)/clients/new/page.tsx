import NewClientForm from "@/components/NewClientForm";
import BackButton from "@/components/BackButton";

export default function NewClientPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <BackButton />
        <h1 className="mt-2 font-sans text-3xl font-extrabold text-ink">Nouveau client</h1>
      </header>
      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <NewClientForm />
      </div>
    </div>
  );
}
