export default function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-soft">
      <div className="h-1.5" style={{ backgroundColor: accent }} />
      <div className="p-6">
        <p className="text-sm font-light text-ink/50">{label}</p>
        <p
          className="mt-2 font-sans text-4xl font-extrabold"
          style={{ color: accent === "#CCFF00" ? "#1D1C1F" : accent }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
