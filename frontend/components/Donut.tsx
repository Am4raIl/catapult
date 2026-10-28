export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export function Donut({
  segments,
  ariaLabel,
  className = "h-40 w-40",
}: {
  segments: DonutSegment[];
  ariaLabel: string;
  className?: string;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  let cursor = 0;

  const stops = segments.map((segment) => {
    const start = cursor;
    const end = total > 0 ? start + (segment.value / total) * 360 : start;
    cursor = end;
    return `${segment.color} ${start}deg ${end}deg`;
  });

  return (
    <div
      className={`relative rounded-full ${className}`}
      role="img"
      aria-label={ariaLabel}
      style={{
        background:
          total > 0
            ? `conic-gradient(${stops.join(", ")})`
            : "var(--line-soft)",
      }}
    >
      <div className="absolute inset-[22%] rounded-full bg-surface" />
    </div>
  );
}
