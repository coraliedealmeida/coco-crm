import BrandForm from "@/components/BrandForm";

export default function NewBrandPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-sans text-3xl font-extrabold text-ink">Nouvelle marque</h1>
      </header>
      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <BrandForm />
      </div>
    </div>
  );
}
