export function ProgressBar({
  value,
  max,
  className = "",
}: {
  value: number;
  max: number;
  className?: string;
}) {
  const width = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-line-soft ${className}`}
      aria-hidden="true"
    >
      <div
        className="h-full rounded-full bg-violet transition-[width]"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
