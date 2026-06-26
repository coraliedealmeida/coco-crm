export default function DashboardSection({
  title,
  icon,
  accent = "#8B5CF6",
  count,
  children,
  emptyLabel,
  isEmpty,
}: {
  title: string;
  icon?: string;
  accent?: string;
  count?: number;
  children?: React.ReactNode;
  emptyLabel?: string;
  isEmpty?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-soft">
      <div className="h-1.5" style={{ backgroundColor: accent }} />
      <div className="p-6">
        <div className="mb-4 flex items-center gap-2">
          {icon && <span className="text-lg">{icon}</span>}
          <h2 className="font-sans text-base font-extrabold text-ink">{title}</h2>
          {count != null && (
            <span
              className="ml-auto rounded-full px-2.5 py-0.5 text-xs font-bold"
              style={{ backgroundColor: `${accent}26`, color: accent }}
            >
              {count}
            </span>
          )}
        </div>
        {isEmpty ? (
          <p className="text-sm font-light text-ink/40">{emptyLabel ?? "Rien pour le moment."}</p>
        ) : (
          <div className="flex flex-col gap-2">{children}</div>
        )}
      </div>
    </div>
  );
}
