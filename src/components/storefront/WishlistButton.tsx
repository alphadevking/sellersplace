"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleWishlist } from "@/app/actions/wishlist";

/**
 * Etsy-style favorite heart. `variant="overlay"` floats on a product card
 * image; `variant="detail"` sits inline next to the add-to-cart actions.
 */
export default function WishlistButton({
  productId,
  initialWishlisted,
  variant = "overlay",
}: {
  productId: string;
  initialWishlisted: boolean;
  variant?: "overlay" | "detail";
}) {
  const pathname = usePathname();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    // Cards wrap the whole tile in a Link — don't navigate when hearting.
    e.preventDefault();
    e.stopPropagation();
    setWishlisted((w) => !w); // optimistic; guests get redirected to /login by the action
    startTransition(async () => {
      const result = await toggleWishlist(productId, pathname);
      setWishlisted(result.wishlisted);
    });
  }

  const heart = (
    <Heart
      className={`h-[18px] w-[18px] transition-transform duration-150 ${wishlisted ? "scale-110" : ""}`}
      style={{
        color: wishlisted ? "var(--brand)" : "var(--foreground)",
        fill: wishlisted ? "var(--brand)" : "transparent",
      }}
    />
  );

  if (variant === "detail") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={wishlisted}
        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        className="btn-ghost border"
        style={{ borderColor: "var(--border)" }}
      >
        {heart}
        {wishlisted ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={wishlisted}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm shadow-black/10 backdrop-blur-sm transition-transform hover:scale-105 active:scale-95"
    >
      {heart}
    </button>
  );
}
