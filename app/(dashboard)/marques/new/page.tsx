import BrandForm from "@/components/BrandForm";

export default function NewBrandPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-sans text-3xl font-extrabold text-ink">Nouvelle marque</h1>
        <p className="font-light text-ink/60">
          La routine d&apos;engagement démarre dès la création.
        </p>
      </header>
      <BrandForm />
    </div>
  );
}
