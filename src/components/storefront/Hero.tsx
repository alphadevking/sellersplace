"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { storeConfig, terms } from "@/config/store";
import SmartImage from "@/components/SmartImage";

// Slower-than-realtime playback reads as calm and cinematic rather than busy.
const PLAYBACK_RATE = 0.5;
// Scroll distance (px) over which the corners grow from their resting curve to
// the full device max.
const ROUND_OVER_PX = 480;
// Corner radius already present at the top (fraction of the device max), so the
// hero reads as a soft card even before you scroll.
const REST_RADIUS_FRACTION = 0.5;

/**
 * Full-bleed hero. Client-side because two things need the browser:
 *  - the background video plays at a reduced rate (no HTML attribute for this)
 *  - the corner radius grows as you scroll, so the immersive edge-to-edge hero
 *    settles into a rounded card as it recedes. The *max* radius is set per
 *    device via CSS breakpoints (--hero-r); JS only drives the 0→1 progress
 *    (--hp), keeping the "per device type" and "per scroll" concerns separate.
 */
export default function Hero({
  videoSrc,
  poster,
  posterAlt,
  ctaHref,
}: {
  videoSrc?: string;
  poster?: string;
  posterAlt: string;
  ctaHref: string;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasMedia = Boolean(videoSrc || poster);

  // Reduce playback speed (playbackRate resets whenever new data loads, so
  // reassert it on loadeddata as well as mount).
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const apply = () => {
      v.playbackRate = PLAYBACK_RATE;
    };
    apply();
    v.addEventListener("loadeddata", apply);
    return () => v.removeEventListener("loadeddata", apply);
  }, [videoSrc]);

  // Grow the corner radius with scroll: from REST_RADIUS_FRACTION of the device
  // max (read from the responsive --hero-r CSS var) up to the full max. Reading
  // the max on mount/resize keeps the "per device type" scale in CSS while JS
  // only handles the scroll response. Throttled to a frame.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    let raf = 0;
    let maxRadius = 0;
    const readMax = () => {
      maxRadius = parseFloat(getComputedStyle(el).getPropertyValue("--hero-r")) || 0;
    };
    const apply = () => {
      raf = 0;
      // If the CSS var couldn't be read, leave the class-based rest radius in
      // place rather than clobbering it to 0.
      if (!maxRadius) return;
      const p = Math.min(Math.max(window.scrollY / ROUND_OVER_PX, 0), 1);
      const scale = REST_RADIUS_FRACTION + (1 - REST_RADIUS_FRACTION) * p;
      el.style.borderRadius = `${maxRadius * scale}px`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onResize = () => {
      readMax();
      apply();
    };
    readMax();
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative -mt-[9.25rem] mx-[calc(50%-50vw+0.75rem)] flex min-h-[92vh] w-[calc(100vw-1.5rem)] flex-col items-center justify-center overflow-hidden bg-surface text-center [--hero-r:24px] rounded-[calc(var(--hero-r)*0.5)] sm:[--hero-r:36px] lg:-mt-[6.25rem] lg:[--hero-r:52px]"
    >
      {videoSrc ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          poster={poster || undefined}
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={videoSrc} />
        </video>
      ) : poster ? (
        <SmartImage
          src={poster}
          alt={posterAlt}
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
      ) : (
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full opacity-40 blur-3xl"
          style={{ background: "var(--brand-soft)" }}
        />
      )}

      {hasMedia && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/55" />
      )}

      <div
        className={`relative z-10 flex w-full max-w-3xl flex-col items-center px-5 [text-shadow:0_2px_28px_rgb(0_0_0_/_0.35)] ${
          hasMedia ? "text-white" : "[text-shadow:none]"
        }`}
      >
        <span className={`eyebrow mb-5 ${hasMedia ? "text-white/75" : ""}`}>New collection</span>
        <h1 className="display-hero text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-7xl">
          {terms.heroTagline}{" "}
          <span style={{ color: "var(--brand)" }}>{storeConfig.name}</span>.
        </h1>
        <p
          className={`mt-5 max-w-[44ch] text-base leading-relaxed sm:text-lg ${
            hasMedia ? "text-white/80" : "text-muted"
          }`}
        >
          {storeConfig.description}
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Link href={ctaHref} className="btn-primary btn-lg btn-pill">
            {terms.heroCta} <ArrowRight className="h-4 w-4" />
          </Link>
          <span className={`text-xs ${hasMedia ? "text-white/65" : "text-muted"}`}>
            Pay online or on delivery
          </span>
        </div>
      </div>
    </section>
  );
}
