"use client";

/**
 * Slim, non-blocking navigation indicator pinned to the top of the viewport.
 * Replaces the full-screen dimming overlay for route transitions so an
 * in-place change (e.g. a catalog filter) never obscures content that's
 * already on screen. The full-screen LoadingOverlay is reserved for genuinely
 * blocking actions (payment redirect, sign-in).
 */
export default function TopProgressBar({ show }: { show: boolean }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] transition-opacity duration-300 ${
        show ? "opacity-100" : "opacity-0"
      }`}
    >
      {show && (
        <div className="relative h-full w-full overflow-hidden">
          <span className="route-bar" />
        </div>
      )}
    </div>
  );
}
