export default function DashboardSection({
  title,
  children,
  emptyLabel,
  isEmpty,
}: {
  title: string;
  children?: React.ReactNode;
  emptyLabel?: string;
  isEmpty?: boolean;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-soft">
      <h2 className="mb-4 font-sans text-base font-extrabold text-ink">{title}</h2>
      {isEmpty ? (
        <p className="text-sm font-light text-ink/40">{emptyLabel ?? "Rien pour le moment."}</p>
      ) : (
        <div className="flex flex-col gap-2">{children}</div>
      )}
    </div>
  );
}
