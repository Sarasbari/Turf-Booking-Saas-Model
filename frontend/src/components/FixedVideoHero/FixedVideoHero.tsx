import { PropsWithChildren, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./FixedVideoHero.module.css";

gsap.registerPlugin(ScrollTrigger);

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

type FixedVideoHeroProps = PropsWithChildren<{
  /**
   * Put the file in `frontend/public/` and reference it like "/landing-impact.webm".
   */
  src: string;
  /**
   * Total hero section height. Video stays pinned for this entire span.
   */
  heroHeightVh?: number;
  /**
   * How much scroll distance is used to advance the video from first to last frame.
   */
  videoScrollVh?: number;
  /**
   * Optional: tune how "dense" the scroll scrubbing feels (roughly perceived frames).
   * Higher = more scroll distance = smaller time deltas per scroll tick.
   */
  targetFrames?: number;
  /**
   * Pixels of scroll per frame when using `targetFrames` (responsive + consistent).
   */
  pxPerFrame?: number;
  /**
   * Gentle smoothing for time updates. 0 = no smoothing.
   */
  easing?: number;
  /**
   * Extra scroll distance to keep the hero pinned AFTER the video completes,
   * giving time for the post-video overlay to fade in before unpin.
   */
  postRevealHoldVh?: number;
  /**
   * Fade duration for the post-video overlay (ms).
   */
  overlayFadeMs?: number;
}>;

export function FixedVideoHero({
  src,
  heroHeightVh = 240,
  videoScrollVh = 160,
  targetFrames = 180,
  pxPerFrame = 10,
  easing = 0.14,
  postRevealHoldVh = 60,
  overlayFadeMs = 450,
  children,
}: FixedVideoHeroProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const pinRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [completed, setCompleted] = useState(false);
  const maxTimeRef = useRef(0);
  const targetTimeRef = useRef(0);
  const currentTimeRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const overlayShownRef = useRef(false);

  const heroHeight = useMemo(() => `${Math.max(120, heroHeightVh)}vh`, [heroHeightVh]);
  const videoEnd = useMemo(() => {
    // Prefer pixel-based "frames" (more consistent across devices) if provided.
    if (targetFrames && targetFrames > 0) {
      return () => `+=${Math.max(600, Math.round(targetFrames * pxPerFrame))}`;
    }
    return `+=${Math.max(80, videoScrollVh)}vh`;
  }, [targetFrames, pxPerFrame, videoScrollVh]);
  const pinEnd = useMemo(
    () => `+=${Math.max(120, videoScrollVh + postRevealHoldVh)}vh`,
    [videoScrollVh, postRevealHoldVh],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.loop = false;
    video.autoplay = false;

    const onError = () => {
      if (cancelled) return;
      setError("Video failed to load. Ensure the file exists under frontend/public/.");
    };

    const onLoadedMeta = () => {
      if (cancelled) return;
      // Ensure we start on frame 1, with no autoplay.
      video.pause();
      video.currentTime = 0;
      maxTimeRef.current = 0;
      targetTimeRef.current = 0;
      currentTimeRef.current = 0;
      setCompleted(false);
      overlayShownRef.current = false;
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
    const pin = pinRef.current;
    const overlay = overlayRef.current;
    const video = videoRef.current;
    if (!section || !pin || !overlay || !video) return;

    const ctx = gsap.context(() => {
      // Always keep overlay hidden until the video completes.
      gsap.set(overlay, { autoAlpha: 0, y: 18 });

      const ensureRaf = () => {
        if (rafRef.current != null) return;
        const tick = () => {
          const v = videoRef.current;
          if (!v || !v.duration) {
            rafRef.current = requestAnimationFrame(tick);
            return;
          }

          const target = targetTimeRef.current;
          const curr = currentTimeRef.current;
          const next =
            easing <= 0 ? target : curr + (target - curr) * clamp01(easing);

          currentTimeRef.current = next;
          v.currentTime = Math.min(v.duration, next);
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      };

      const stopRaf = () => {
        if (rafRef.current == null) return;
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      };

      // 1) Pin the video layer for the entire hero span (video + post-reveal hold).
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: pinEnd,
        pin,
        pinSpacing: true,
        anticipatePin: 1,
        onEnter: () => ensureRaf(),
        onEnterBack: () => ensureRaf(),
        onLeave: () => stopRaf(),
        onLeaveBack: () => stopRaf(),
      });

      // 2) Scroll-driven video advancement, forward-only.
      // - No autoplay on load: we only update frames once the user scrolls into the section.
      // - No reverse: we clamp currentTime to the maximum reached.
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: videoEnd,
        onUpdate: (self) => {
          const v = videoRef.current;
          if (!v || !v.duration || !Number.isFinite(v.duration)) return;

          // Scroll -> time mapping for the "play once" segment.
          const wanted = Math.max(0, Math.min(v.duration, self.progress * v.duration));
          const clamped = Math.max(maxTimeRef.current, wanted);
          maxTimeRef.current = clamped;
          targetTimeRef.current = clamped;

          // Freeze on last frame once completed.
          const nearEnd = v.duration - 0.033; // ~1 frame @ 30fps
          if (clamped >= nearEnd) {
            targetTimeRef.current = v.duration;
            currentTimeRef.current = v.duration;
            v.currentTime = v.duration;
            if (!overlayShownRef.current) {
              overlayShownRef.current = true;
              setCompleted(true);
              gsap.to(overlay, {
                autoAlpha: 1,
                y: 0,
                duration: Math.min(0.6, Math.max(0.3, overlayFadeMs / 1000)),
                ease: "power2.out",
              });
            }
            return;
          }
        },
      });
    }, section);

    return () => {
      ctx.revert();
    };
  }, [ready, pinEnd, videoEnd, overlayFadeMs, easing]);

  return (
    <section ref={sectionRef} className={styles.hero} style={{ height: heroHeight }}>
      <div ref={pinRef} className={styles.pin} aria-hidden="true">
        <video
          ref={videoRef}
          className={styles.video}
          src={src}
          muted
          playsInline
          preload="auto"
          // Scroll-controlled playback: no autoplay, no loop.
        />
      </div>

      <div
        ref={overlayRef}
        className={styles.overlay}
        data-visible={completed ? "true" : "false"}
      >
        <div className={styles.overlayInner}>{children}</div>
      </div>

      {error ? (
        <div className={styles.fallback}>
          <div className={styles.fallbackInner}>
            <div className={styles.fallbackTitle}>Missing hero video</div>
            <div className={styles.fallbackText}>
              Put your video at{" "}
              <code className={styles.code}>frontend/public/landing-impact.webm</code>{" "}
              (or update the <code className={styles.code}>src</code> prop).
            </div>
            <div className={styles.fallbackText}>{error}</div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

