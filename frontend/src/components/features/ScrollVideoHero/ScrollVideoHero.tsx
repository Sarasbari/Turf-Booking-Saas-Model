import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./ScrollVideoHero.module.css";

gsap.registerPlugin(ScrollTrigger);

type ScrollVideoHeroProps = {
  /**
   * Put the file in `frontend/public/` and reference it like "/landing-impact.webm"
   * (or .mp4/.webm). For scroll-scrubbing, use a real video container format.
   */
  src: string;
  /**
   * How long the pinned scroll segment should be relative to viewport height.
   * Bigger = more scroll distance = finer control.
   */
  scrollLengthVh?: number;
  /**
   * Gentle easing / smoothing for time updates. 0 = no smoothing.
   */
  easing?: number;
};

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

export function ScrollVideoHero({
  src,
  scrollLengthVh = 220,
  easing = 0.12,
}: ScrollVideoHeroProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const targetTimeRef = useRef<number>(0);
  const currentTimeRef = useRef<number>(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const end = useMemo(() => `+=${Math.max(120, scrollLengthVh)}vh`, [scrollLengthVh]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;

    // Ensure the browser buffers as much as it reasonably can.
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.controls = false;

    const onError = () => {
      if (cancelled) return;
      setError("Video failed to load. Ensure the file exists under frontend/public/.");
    };

    const onLoadedMeta = () => {
      if (cancelled) return;
      // Start on frame 1 (time 0). We do NOT autoplay.
      video.currentTime = 0;
      currentTimeRef.current = 0;
      targetTimeRef.current = 0;
      setReady(true);
    };

    video.addEventListener("error", onError);
    video.addEventListener("loadedmetadata", onLoadedMeta);

    return () => {
      cancelled = true;
      video.removeEventListener("error", onError);
      video.removeEventListener("loadedmetadata", onLoadedMeta);
    };
  }, [src]);

  useEffect(() => {
    if (!ready) return;
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    let st: ScrollTrigger | null = null;
    let killed = false;

    const tick = () => {
      if (killed) return;
      const v = videoRef.current;
      if (v) {
        const target = targetTimeRef.current;
        const curr = currentTimeRef.current;
        const next =
          easing <= 0 ? target : curr + (target - curr) * clamp01(easing);

        // Avoid tiny fractional updates that can cause thrash on some browsers.
        const snapped = Math.abs(next - curr) < 0.0005 ? target : next;
        currentTimeRef.current = snapped;

        // Guard against NaN while metadata is odd or duration is 0.
        if (Number.isFinite(snapped) && snapped >= 0 && v.duration) {
          // Setting currentTime is the "frame-by-frame" driver.
          v.currentTime = Math.min(v.duration, snapped);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    const ensureRaf = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(tick);
    };

    const stopRaf = () => {
      if (rafRef.current == null) return;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };

    // We only "begin" when section becomes visible.
    st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end,
      pin: true,
      anticipatePin: 1,
      scrub: 0, // we handle smoothing ourselves to avoid ScrollTrigger skipping
      onEnter: () => ensureRaf(),
      onEnterBack: () => ensureRaf(),
      onLeave: () => stopRaf(),
      onLeaveBack: () => stopRaf(),
      onUpdate: (self) => {
        const v = videoRef.current;
        if (!v || !v.duration) return;
        const t = self.progress * v.duration;
        targetTimeRef.current = Math.max(0, Math.min(v.duration, t));
      },
    });

    // First paint sync when we enter.
    targetTimeRef.current = 0;
    currentTimeRef.current = 0;

    return () => {
      killed = true;
      stopRaf();
      st?.kill();
      st = null;
    };
  }, [ready, end, easing]);

  return (
    <section ref={sectionRef} className={styles.hero} aria-label="Landing hero">
      <video
        ref={videoRef}
        className={styles.video}
        src={src}
        // We intentionally do NOT set autoPlay.
        muted
        playsInline
        preload="auto"
      />

      {error ? (
        <div className={styles.fallback}>
          <div className={styles.fallbackInner}>
            <div className={styles.fallbackTitle}>Missing hero video</div>
            <div className={styles.fallbackText}>
              Put your video at <code className={styles.code}>frontend/public/landing-impact.webm</code>{" "}
              (or update the <code className={styles.code}>src</code> prop).
            </div>
            <div className={styles.fallbackText}>{error}</div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

