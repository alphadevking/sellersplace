import { Star } from "lucide-react";

/** Read-only star row, filled to the given rating (halves round up visually). */
export default function Stars({
  rating,
  size = 14,
}: {
  rating: number;
  size?: number;
}) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{
            width: size,
            height: size,
            color: "var(--brand)",
            fill: i <= Math.round(rating) ? "var(--brand)" : "transparent",
          }}
        />
      ))}
    </span>
  );
}
