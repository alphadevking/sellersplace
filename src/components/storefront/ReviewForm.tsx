"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { submitReview, type ReviewFormState } from "@/app/actions/reviews";

const INITIAL: ReviewFormState = { ok: false };

/** Star-picker review form for verified buyers (server-enforced). */
export default function ReviewForm({
  productId,
  productSlug,
  initialRating = 0,
  initialBody = "",
}: {
  productId: string;
  productSlug: string;
  initialRating?: number;
  initialBody?: string;
}) {
  const [state, formAction, pending] = useActionState(submitReview, INITIAL);
  const [rating, setRating] = useState(initialRating);
  const [hovered, setHovered] = useState(0);
  const editing = initialRating > 0;

  if (state.ok) {
    return (
      <p className="card-surface p-4 text-sm">
        Thanks — your review is live. You can resubmit anytime to update it.
      </p>
    );
  }

  return (
    <form action={formAction} className="card-surface flex flex-col gap-3 p-4">
      <span className="text-sm font-semibold">
        {editing ? "Update your review" : "Write a review"}
      </span>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="productSlug" value={productSlug} />
      <input type="hidden" name="rating" value={rating} />
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`${i} star${i > 1 ? "s" : ""}`}
            className="p-0.5"
          >
            <Star
              className="h-6 w-6 transition-transform hover:scale-110"
              style={{
                color: "var(--brand)",
                fill: i <= (hovered || rating) ? "var(--brand)" : "transparent",
              }}
            />
          </button>
        ))}
      </div>
      <textarea
        name="body"
        rows={3}
        maxLength={2000}
        defaultValue={initialBody}
        placeholder="What did you think? (optional)"
        className="input-field"
      />
      {state.error && (
        <p className="alert-error text-xs" role="alert">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending || rating === 0}
        className="btn-primary self-start"
      >
        {pending ? "Submitting…" : editing ? "Update review" : "Submit review"}
      </button>
    </form>
  );
}
