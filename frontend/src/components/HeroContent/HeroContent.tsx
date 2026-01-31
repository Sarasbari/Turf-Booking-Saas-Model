import { ReactNode, useEffect } from "react";
import gsap from "gsap";
import styles from "./HeroContent.module.css";

type HeroContentProps = {
  title: string;
  subtitle?: ReactNode;
  children?: ReactNode;
};

export function HeroContent({ title, subtitle, children }: HeroContentProps) {
  useEffect(() => {
    // We target the parent section which we gave the class 'turf-hero-section'
    // Ensure we wait for layout
    const ctx = gsap.context(() => {
      // Intro animation (load) - Slide 1 appears
      gsap.fromTo(`.${styles.slide1}`,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: "power3.out" }
      );

      // Scroll animation - Sequence: Slide 1 leaves -> Slide 2 enters
      // We use the pinning duration of the parent. 
      // Since we don't know exact px, we scrub linked to the section's scroll progress.

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ".turf-hero-section",
          start: "top top", // When hero hits top
          end: "bottom bottom", // When hero ends (it's pinned, so this covers the pin duration)
          scrub: 1,
        }
      });

      // 0% - 15%: Initial Hold
      // 15% - 35%: Slide 1 fades out & moves up
      tl.to(`.${styles.slide1}`, {
        opacity: 0,
        y: -60,
        scale: 0.95,
        duration: 1,
        ease: "power2.inOut"
      }, 0.5);

      // 35% - 55%: Slide 2 fades in & moves up (Arrival)
      tl.fromTo(`.${styles.slide2}`,
        {
          opacity: 0,
          y: 60,
          scale: 1.05
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1,
          ease: "power2.out"
        },
        ">-=0.5" // Slight overlap
      );

      // 55% - 100%: Slide 2 is STATIC (no movement)
      // We just let the timeline finish. The elements are pinned by parent, 
      // so they sit there perfectly still.

      // 60% - 100%: Slide 2 stays visible
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className={styles.wrap}>
      {/* Slide 1: Branding */}
      <div className={styles.slide1}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle ? <p className={styles.sub}>{subtitle}</p> : null}
      </div>

      {/* Slide 2: Functional Inputs */}
      <div className={styles.slide2}>
        <h2 className={styles.searchTitle}>Book Your Spot</h2>
        <div className="hero-search-container" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
