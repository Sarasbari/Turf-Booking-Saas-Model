import { PropsWithChildren, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./ScrollFramesHero.module.css";

gsap.registerPlugin(ScrollTrigger);

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

type ScrollFramesHeroProps = PropsWithChildren<{
  /** Base path for frames including name prefix, e.g. "/Frames/ezgif-frame-" */
  framePathPrefix?: string;
  /** File extension, e.g. ".jpg" */
  frameExtension?: string;
  /** Total number of frames (1-based filenames: 001, 002, ... frameCount) */
  frameCount?: number;
  /** Scroll distance in pixels to go from first to last frame */
  scrollPxPerFrame?: number;
  /** Easing for frame index lerp (0 = instant) */
  easing?: number;
  /** Section height in vh (pinned span) */
  heroHeightVh?: number;
}>;

const DEFAULT_FRAME_PREFIX = "/Frames/ezgif-frame-";
const DEFAULT_FRAME_EXTENSION = ".jpg";
const DEFAULT_FRAME_COUNT = 35;

/** 0-based index → 1-based zero-padded frame number (e.g. 0 → "001") */
function frameNumber(i: number, digits = 3) {
  return String(Math.max(1, Math.floor(i) + 1)).padStart(digits, "0");
}

export function ScrollFramesHero({
  framePathPrefix = DEFAULT_FRAME_PREFIX,
  frameExtension = DEFAULT_FRAME_EXTENSION,
  frameCount = DEFAULT_FRAME_COUNT,
  scrollPxPerFrame = 12,
  easing = 0.08,
  heroHeightVh = 280,
  children,
}: ScrollFramesHeroProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const pinRef = useRef<HTMLDivElement | null>(null);
  const imgARef = useRef<HTMLImageElement | null>(null);
  const imgBRef = useRef<HTMLImageElement | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const targetFrameRef = useRef(0);
  const currentFrameRef = useRef(0);
  const displayedFrameRef = useRef(-1);
  const rafRef = useRef<number | null>(null);
  const useARef = useRef(true);

  const totalScrollPx = useMemo(
    () => Math.max(800, frameCount * scrollPxPerFrame),
    [frameCount, scrollPxPerFrame]
  );
  const pinEnd = useMemo(
    () => `+=${totalScrollPx + 200}`,
    [totalScrollPx]
  );
  const heroHeight = useMemo(() => `${Math.max(150, heroHeightVh)}vh`, [heroHeightVh]);

  const frameUrl = (i: number) => {
    const idx = Math.max(0, Math.min(frameCount - 1, Math.floor(i)));
    return `${framePathPrefix}${frameNumber(idx)}${frameExtension}`;
  };

  useEffect(() => {
    const img = new Image();
    img.onload = () => setReady(true);
    img.onerror = () => setError("Frame assets not found. Ensure /Frames/ exist in public.");
    img.src = frameUrl(0);
  }, [framePathPrefix, frameExtension, frameCount]);

  useEffect(() => {
    if (!ready) return;
    const section = sectionRef.current;
    const pin = pinRef.current;
    const imgA = imgARef.current;
    const imgB = imgBRef.current;
    if (!section || !pin || !imgA || !imgB) return;

    let killed = false;
    imgA.src = frameUrl(0);
    imgA.style.opacity = "1";
    imgB.style.opacity = "0";

    const tick = () => {
      if (killed) return;
      const target = targetFrameRef.current;
      let curr = currentFrameRef.current;
      curr =
        easing <= 0
          ? target
          : curr + (target - curr) * clamp01(easing);
      currentFrameRef.current = curr;

      const idx = Math.round(curr);
      const idxClamped = Math.max(0, Math.min(frameCount - 1, idx));
      if (idxClamped !== displayedFrameRef.current) {
        displayedFrameRef.current = idxClamped;
        const nextImg = useARef.current ? imgB : imgA;
        const activeImg = useARef.current ? imgA : imgB;
        nextImg.src = frameUrl(idxClamped);
        nextImg.style.opacity = "1";
        activeImg.style.opacity = "0";
        useARef.current = !useARef.current;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    const ensureRaf = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(tick);
    };
    const stopRaf = () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: pinEnd,
      pin: pin,
      pinSpacing: true,
      anticipatePin: 1,
      onEnter: ensureRaf,
      onEnterBack: ensureRaf,
      onLeave: stopRaf,
      onLeaveBack: stopRaf,
      onUpdate: (self) => {
        const t = self.progress;
        targetFrameRef.current = t * (frameCount - 1);
      },
    });

    return () => {
      killed = true;
      stopRaf();
      st.kill();
    };
  }, [ready, pinEnd, frameCount, framePathPrefix, frameExtension, easing]);

  return (
    <section
      ref={sectionRef}
      className={`${styles.hero} turf-hero-section`}
      style={{ height: heroHeight }}
      aria-label="Landing hero"
    >
      <div ref={pinRef} className={styles.pin}>
        <img
          ref={imgARef}
          className={`${styles.frameLayer} ${styles.frameLayerA}`}
          alt=""
          decoding="async"
          draggable={false}
        />
        <img
          ref={imgBRef}
          className={`${styles.frameLayer} ${styles.frameLayerB}`}
          alt=""
          decoding="async"
          draggable={false}
        />
        <div className={styles.veil} aria-hidden="true" />
        <div className={styles.overlay}>{children}</div>
      </div>

      {error ? (
        <div className={styles.fallback}>
          <div className={styles.fallbackInner}>{error}</div>
        </div>
      ) : null}
    </section>
  );
}
